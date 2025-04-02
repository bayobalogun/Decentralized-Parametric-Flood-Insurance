;; policy-issuance.clar
;; Handles the issuance of parametric flood insurance policies

;; Error codes
(define-constant ERR_UNAUTHORIZED u1)
(define-constant ERR_INVALID_AMOUNT u2)
(define-constant ERR_POLICY_EXISTS u3)
(define-constant ERR_POLICY_NOT_FOUND u4)
(define-constant ERR_EXPIRED u5)

;; Data structures
(define-map policies
  { policy-id: uint }
  {
    owner: principal,
    coverage-amount: uint,
    premium-amount: uint,
    location-id: uint,
    threshold-value: uint,
    start-block: uint,
    end-block: uint,
    active: bool
  }
)

(define-data-var next-policy-id uint u1)

;; Read-only functions
(define-read-only (get-policy (policy-id uint))
  (map-get? policies { policy-id: policy-id })
)

(define-read-only (get-next-policy-id)
  (var-get next-policy-id)
)

(define-read-only (is-policy-active (policy-id uint))
  (match (get-policy policy-id)
    policy (and
            (get active policy)
            (< block-height (get end-block policy))
           )
    false
  )
)

;; Public functions
(define-public (issue-policy
                (coverage-amount uint)
                (premium-amount uint)
                (location-id uint)
                (threshold-value uint)
                (duration uint))
  (let (
    (policy-id (var-get next-policy-id))
    (start-block block-height)
    (end-block (+ block-height duration))
  )
    ;; Validate inputs
    (asserts! (> coverage-amount u0) (err ERR_INVALID_AMOUNT))
    (asserts! (> premium-amount u0) (err ERR_INVALID_AMOUNT))

    ;; Collect premium payment
    (try! (stx-transfer? premium-amount tx-sender (as-contract tx-sender)))

    ;; Create policy
    (map-set policies
      { policy-id: policy-id }
      {
        owner: tx-sender,
        coverage-amount: coverage-amount,
        premium-amount: premium-amount,
        location-id: location-id,
        threshold-value: threshold-value,
        start-block: start-block,
        end-block: end-block,
        active: true
      }
    )

    ;; Increment policy ID counter
    (var-set next-policy-id (+ policy-id u1))

    ;; Return success with policy ID
    (ok policy-id)
  )
)

(define-public (cancel-policy (policy-id uint))
  (let (
    (policy (unwrap! (get-policy policy-id) (err ERR_POLICY_NOT_FOUND)))
  )
    ;; Verify ownership
    (asserts! (is-eq tx-sender (get owner policy)) (err ERR_UNAUTHORIZED))
    ;; Verify policy is active
    (asserts! (get active policy) (err ERR_POLICY_NOT_FOUND))

    ;; Update policy to inactive
    (map-set policies
      { policy-id: policy-id }
      (merge policy { active: false })
    )

    ;; Return partial premium based on remaining time (simplified)
    (let (
      (elapsed (- block-height (get start-block policy)))
      (total-duration (- (get end-block policy) (get start-block policy)))
      (remaining-duration (- total-duration elapsed))
      (refund-amount (/ (* (get premium-amount policy) remaining-duration) total-duration))
    )
      ;; Fix: ensure both branches return the same type (response bool uint)
      (if (> refund-amount u0)
        (as-contract (stx-transfer? refund-amount tx-sender (get owner policy)))
        (ok true) ;; Changed from (ok u0) to (ok true) to match types
      )
    )
  )
)

