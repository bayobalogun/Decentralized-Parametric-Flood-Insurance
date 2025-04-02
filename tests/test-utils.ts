// test-utils.ts
// Utility functions for testing Clarity contracts with Vitest

import { vi } from "vitest"

// Mock Clarity values
export function mockUint(value: number) {
	return { type: "uint", value: BigInt(value) }
}

export function mockInt(value: number) {
	return { type: "int", value: BigInt(value) }
}

export function mockBool(value: boolean) {
	return { type: "bool", value }
}

export function mockPrincipal(address: string) {
	return { type: "principal", value: address }
}

export function mockStringAscii(value: string) {
	return { type: "string-ascii", value }
}

export function mockResponse({ success, result, error }: { success: boolean; result?: any; error?: string }) {
	if (success) {
		return { success, result }
	} else {
		return { success, error }
	}
}

// Mock Clarity runtime
export const mockClarityBin = {
	evalContract: vi.fn(),
	getContractState: vi.fn(),
}

export const mockClarityEval = vi.fn()

// Helper to create mock Clarity values
export function mockClarityValue(type: string, value: any) {
	return { type, value }
}

