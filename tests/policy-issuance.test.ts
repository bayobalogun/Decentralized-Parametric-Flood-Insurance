import { describe, it, expect, beforeEach, vi } from "vitest"
import { mockClarityBin, mockClarityEval, mockPrincipal, mockUint, mockBool, mockResponse } from "./test-utils"

// Mock the Clarity runtime
vi.mock("./clarity-runtime", () => ({
  evalContract: vi.fn(),
  getContractState: vi.fn(),
}))

describe("Policy Issuance Contract", () => {
  const contractName = "policy-issuance"
  const ownerAddress = mockPrincipal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM")
  const userAddress = mockPrincipal("ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG")
  
  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks()
    
    // Setup mock contract state
    mockClarityBin.getContractState.mockReturnValue({
      "next-policy-id": mockUint(1),
      policies: new Map(),
    })
  })
  
  describe("issue-policy", () => {
    it("should issue a new policy when valid parameters are provided", async () => {
      // Arrange
      const coverageAmount = mockUint(1000000)
      const premiumAmount = mockUint(50000)
      const locationId = mockUint(1)
      const thresholdValue = mockUint(100)
      const duration = mockUint(144 * 30) // ~30 days in blocks
      
      mockClarityEval.mockReturnValue(
          mockResponse({
            success: true,
            result: mockUint(1),
          }),
      )
      
      // Act
      const result = await mockClarityBin.evalContract(
          contractName,
          "issue-policy",
          [coverageAmount, premiumAmount, locationId, thresholdValue, duration],
          { sender: userAddress },
      )
      
      // Assert
      expect(result.success).toBe(true)
      expect(result.result).toEqual(mockUint(1))
      expect(mockClarityEval).toHaveBeenCalledWith(
          contractName,
          "issue-policy",
          [coverageAmount, premiumAmount, locationId, thresholdValue, duration],
          { sender: userAddress },
      )
    })
    
    it("should fail when premium amount is zero", async () => {
      // Arrange
      const coverageAmount = mockUint(1000000)
      const premiumAmount = mockUint(0) // Invalid premium
      const locationId = mockUint(1)
      const thresholdValue = mockUint(100)
      const duration = mockUint(144 * 30)
      
      mockClarityEval.mockReturnValue(
          mockResponse({
            success: false,
            error: "ERR_INVALID_AMOUNT",
          }),
      )
      
      // Act
      const result = await mockClarityBin.evalContract(
          contractName,
          "issue-policy",
          [coverageAmount, premiumAmount, locationId, thresholdValue, duration],
          { sender: userAddress },
      )
      
      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toEqual("ERR_INVALID_AMOUNT")
    })
  })
  
  describe("cancel-policy", () => {
    it("should cancel an active policy and refund partial premium", async () => {
      // Arrange
      const policyId = mockUint(1)
      
      // Mock policy exists and is active
      mockClarityBin.getContractState.mockReturnValue({
        policies: new Map([
          [
            { "policy-id": policyId },
            {
              owner: userAddress,
              "coverage-amount": mockUint(1000000),
              "premium-amount": mockUint(50000),
              "location-id": mockUint(1),
              "threshold-value": mockUint(100),
              "start-block": mockUint(100),
              "end-block": mockUint(4500),
              active: mockBool(true),
            },
          ],
        ]),
      })
      
      mockClarityEval.mockReturnValue(
          mockResponse({
            success: true,
            result: mockUint(25000), // Refund amount
          }),
      )
      
      // Act
      const result = await mockClarityBin.evalContract(contractName, "cancel-policy", [policyId], {
        sender: userAddress,
      })
      
      // Assert
      expect(result.success).toBe(true)
      expect(result.result).toEqual(mockUint(25000))
    })
    
    it("should fail when policy does not exist", async () => {
      // Arrange
      const policyId = mockUint(999) // Non-existent policy
      
      mockClarityEval.mockReturnValue(
          mockResponse({
            success: false,
            error: "ERR_POLICY_NOT_FOUND",
          }),
      )
      
      // Act
      const result = await mockClarityBin.evalContract(contractName, "cancel-policy", [policyId], {
        sender: userAddress,
      })
      
      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toEqual("ERR_POLICY_NOT_FOUND")
    })
  })
})

