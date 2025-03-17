"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
  useDisclosure,
  Form,
  Input,
} from "@heroui/react";
import { useState } from "react";

import { CompleteNode } from "@/app/services/nodes";
import {
  addNode,
  createGenesis,
  createNode,
  generateAddress,
  getNodeEnode,
  getNodeDockerIP,
  sleep,
  updateNodeEnode,
} from "@/app/services/network";

interface IProps {
  nodes: CompleteNode[];
  updateNodes: (nodes: CompleteNode[]) => void;
  setLoading: (loading: boolean) => void;
}

export default function NewNode(props: IProps) {
  const { nodes, updateNodes, setLoading } = props;
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [nodeErrors, setNodeErrors] = useState({});

  const callCreateNode = async (e: {
    preventDefault: () => void;
    currentTarget: HTMLFormElement | undefined;
  }) => {
    e.preventDefault();

    let isMasterNode = false;

    const data = Object.fromEntries(new FormData(e.currentTarget));

    if (!data.newNodeName) {
      setNodeErrors({ nodeName: "nodeName is required" });

      return;
    } else if (!data.portJSON) {
      setNodeErrors({ portJSON: "portJSON is required" });

      return;
    } else if (!data.portWS) {
      setNodeErrors({ portWS: "portWS is required" });

      return;
    } else if (!data.portP2P) {
      setNodeErrors({ portP2P: "portP2P is required" });

      return;
    }

    try {
      const newNodeName = data.newNodeName;
      const portJSON = data.portJSON;
      const portWS = data.portWS;
      const portP2P = data.portP2P;

      const newNode: CompleteNode = {
        name: newNodeName as string,
        portJSON: portJSON as unknown as number,
        portWS: portWS as unknown as number,
        portP2P: portP2P as unknown as number,
        status: "unknown",
      };

      setLoading(true);

      if (nodes.length === 0) {
        isMasterNode = true;
        const address = await generateAddress(newNode);

        newNode.address = address;
        await addNode(newNode);
        await createGenesis(newNode.address as string);

        // const eNode = await getNodeEnode(newNode);
        // console.log(eNode);
        //newNode.enode = eNode;
      }

      await createNode(newNode);

      if (isMasterNode) {
        await sleep(10000);
        // setTimeout(async () => {
        const genNode = await getNodeEnode(newNode);
        const genDockerIP = await getNodeDockerIP(newNode);

        // console.log("genNode", genNode);
        newNode.enode = genNode;
        newNode.dockerIP = genDockerIP;
        // nodes[0] .enode = genNode;
        // setNodes([...nodes]);
        // }, 10000);
        await updateNodeEnode(newNode);
      }

      updateNodes([...nodes, newNode]);

      // if (data.isValidator === "isValidator") {
      //   console.log("is validator");
      // } else {
      //   console.log("is not validator");
      // }
      // const resp = await createNode(newName as string);
      // console.log(resp);

      // updateNodes(newName as string);
      setLoading(false);
      onOpenChange();
    } catch (error) {
      console.log(error);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex w-full justify-end py-4 text-2xl">
        <div>
          <Button color="primary" name="createNode" onPress={onOpen}>
            Create new node
          </Button>
        </div>
      </div>
      <Modal backdrop="opaque" isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                New node creation
              </ModalHeader>
              <ModalBody>
                <Form validationErrors={nodeErrors} onSubmit={callCreateNode}>
                  <Input
                    // autoFocus
                    isRequired
                    defaultValue=""
                    errorMessage="Please, enter a valid node name"
                    label="Node Name"
                    labelPlacement="outside"
                    name="newNodeName"
                    placeholder="Node1"
                    type="text"
                  />
                  <Input
                    // autoFocus
                    isRequired
                    defaultValue=""
                    errorMessage="Please, enter a valid port number"
                    label="Port JSON-RPC"
                    labelPlacement="outside"
                    name="portJSON"
                    placeholder="8545"
                    type="number"
                  />
                  <Input
                    // autoFocus
                    isRequired
                    defaultValue=""
                    errorMessage="Please, enter a valid port number"
                    label="Port WS"
                    labelPlacement="outside"
                    name="portWS"
                    placeholder="8546"
                    type="number"
                  />
                  <Input
                    // autoFocus
                    isRequired
                    defaultValue=""
                    errorMessage="Please, enter a valid port number"
                    label="Port P2P"
                    labelPlacement="outside"
                    name="portP2P"
                    placeholder="30303"
                    type="number"
                  />
                  {/* <Checkbox name="isValidator" value="isValidator">
                    Is Validator
                  </Checkbox> */}
                  <div className="flex w-full justify-end pt-4 gap-4">
                    <Button
                      color="primary"
                      type="submit"
                      variant="solid"
                      // onPress={onClose}
                    >
                      Send
                    </Button>
                  </div>
                </Form>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
