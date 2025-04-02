;; governance.clar
;; Handles contract ownership and governance

;; Error codes
(define-constant ERR_UNAUTHORIZED u1)

;; Data variables
(define-data-var contract-owner principal tx-sender)

;; Read-only functions
(define-read-only (get-contract-owner)
  (var-get contract-owner)
)

;; Public functions
(define-public (transfer-ownership (new-owner principal))
  (begin
    ;; Only current owner can transfer ownership
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err ERR_UNAUTHORIZED))

    ;; Update owner
    (var-set contract-owner new-owner)

    ;; Return success
    (ok true)
  )
)
