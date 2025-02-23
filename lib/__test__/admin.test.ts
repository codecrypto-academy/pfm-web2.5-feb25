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

  test("should add a peer", async () => {
    mockProvider.send = jest.fn().mockResolvedValue(true);
    const result = await besuAdmin.addPeer("enode://some-enode-info");
    expect(result).toBe(true);
    expect(mockProvider.send).toHaveBeenCalledWith("admin_addPeer", ["enode://some-enode-info"]);
  });

  test("should remove a peer", async () => {
    mockProvider.send = jest.fn().mockResolvedValue(true);
    const result = await besuAdmin.removePeer("enode://some-enode-info");
    expect(result).toBe(true);
    expect(mockProvider.send).toHaveBeenCalledWith("admin_removePeer", ["enode://some-enode-info"]);
  });

  test("should list peers", async () => {
    const mockPeers = [{ id: "peer1" }, { id: "peer2" }];
    mockProvider.send = jest.fn().mockResolvedValue(mockPeers);
    const result = await besuAdmin.listPeers();
    expect(result).toEqual(mockPeers);
    expect(mockProvider.send).toHaveBeenCalledWith("admin_peers", []);
  });
});
