import BesuAdministration from "../src/administration";
import { ethers } from "ethers";

jest.mock("ethers");

describe("BesuAdministration", () => {
  let besuAdmin: BesuAdministration;
  let mockProvider: jest.Mocked<ethers.JsonRpcProvider>;

  beforeEach(() => {
    mockProvider = new ethers.JsonRpcProvider() as jest.Mocked<ethers.JsonRpcProvider>;
    jest.spyOn(ethers, "JsonRpcProvider").mockReturnValue(mockProvider);
    besuAdmin = new BesuAdministration("http://localhost:8545");
  });

  describe("addPeer", () => {
    test("should add a peer successfully", async () => {
      mockProvider.send = jest.fn().mockResolvedValue(true);
      const result = await besuAdmin.addPeer("enode://some-enode-info");
      expect(result).toBe(true);
      expect(mockProvider.send).toHaveBeenCalledWith("admin_addPeer", ["enode://some-enode-info"]);
    });

    test("should throw an error if adding a peer fails", async () => {
      mockProvider.send = jest.fn().mockRejectedValue(new Error("Failed to add peer"));
      await expect(besuAdmin.addPeer("enode://some-enode-info")).rejects.toThrow("Error adding peer: Error: Failed to add peer");
    });
  });

  describe("removePeer", () => {
    test("should remove a peer successfully", async () => {
      mockProvider.send = jest.fn().mockResolvedValue(true);
      const result = await besuAdmin.removePeer("enode://some-enode-info");
      expect(result).toBe(true);
      expect(mockProvider.send).toHaveBeenCalledWith("admin_removePeer", ["enode://some-enode-info"]);
    });

    test("should throw an error if removing a peer fails", async () => {
      mockProvider.send = jest.fn().mockRejectedValue(new Error("Failed to remove peer"));
      await expect(besuAdmin.removePeer("enode://some-enode-info")).rejects.toThrow("Error removing peer: Error: Failed to remove peer");
    });
  });

  describe("listPeers", () => {
    test("should list peers successfully", async () => {
      const mockPeers = [{ id: "peer1" }, { id: "peer2" }];
      mockProvider.send = jest.fn().mockResolvedValue(mockPeers);
      const result = await besuAdmin.listPeers();
      expect(result).toEqual(mockPeers);
      expect(mockProvider.send).toHaveBeenCalledWith("admin_peers", []);
    });

    test("should throw an error if listing peers fails", async () => {
      mockProvider.send = jest.fn().mockRejectedValue(new Error("Failed to list peers"));
      await expect(besuAdmin.listPeers()).rejects.toThrow("Error fetching peer list: Error: Failed to list peers");
    });
  });

  describe("createAccount", () => {
    test("should create an account successfully", async () => {
      const mockAddress = "0x1234567890abcdef";
      mockProvider.send = jest.fn().mockResolvedValue(mockAddress);
      const result = await besuAdmin.createAccount("password123");
      expect(result).toBe(mockAddress);
      expect(mockProvider.send).toHaveBeenCalledWith("personal_newAccount", ["password123"]);
    });

    test("should throw an error if creating an account fails", async () => {
      mockProvider.send = jest.fn().mockRejectedValue(new Error("Failed to create account"));
      await expect(besuAdmin.createAccount("password123")).rejects.toThrow("Error creating account: Error: Failed to create account");
    });
  });

  describe("unlockAccount", () => {
    test("should unlock an account successfully", async () => {
      mockProvider.send = jest.fn().mockResolvedValue(true);
      const result = await besuAdmin.unlockAccount("0x1234567890abcdef", "password123", 300);
      expect(result).toBe(true);
      expect(mockProvider.send).toHaveBeenCalledWith("personal_unlockAccount", ["0x1234567890abcdef", "password123", 300]);
    });

    test("should throw an error if unlocking an account fails", async () => {
      mockProvider.send = jest.fn().mockRejectedValue(new Error("Failed to unlock account"));
      await expect(besuAdmin.unlockAccount("0x1234567890abcdef", "password123", 300)).rejects.toThrow("Error unlocking account: Error: Failed to unlock account");
    });
  });

  describe("listAccounts", () => {
    test("should list accounts successfully", async () => {
      const mockAccounts = ["0x1234567890abcdef", "0xabcdef1234567890"];
      mockProvider.send = jest.fn().mockResolvedValue(mockAccounts);
      const result = await besuAdmin.listAccounts();
      expect(result).toEqual(mockAccounts);
      expect(mockProvider.send).toHaveBeenCalledWith("eth_accounts", []);
    });

    test("should throw an error if listing accounts fails", async () => {
      mockProvider.send = jest.fn().mockRejectedValue(new Error("Failed to list accounts"));
      await expect(besuAdmin.listAccounts()).rejects.toThrow("Error fetching accounts: Error: Failed to list accounts");
    });
  });
});