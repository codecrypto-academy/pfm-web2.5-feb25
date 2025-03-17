import { Node } from "@dalzemag/besu-clique";

export interface CompleteNode extends Node {
  status: "active" | "stoped" | "unknown";
}
