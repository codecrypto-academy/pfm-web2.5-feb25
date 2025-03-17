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
import { addNode, createGenesis, createNode, generateAddress, getNodeEnode, sleep } from "@/app/services/network";

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

    const data = Object.fromEntries(new FormData(e.currentTarget));

    if (!data.newNodeName) {
      setNodeErrors({ nodeName: "nodeName is required" });

      return;
    }

    const newNodeName = data.newNodeName;

    console.log(JSON.stringify(newNodeName));

    const newNode: CompleteNode = {
      name: newNodeName as string,
      portJSON: 8545,
      portWS: 8546,
      portP2P: 30303,
      status: "unknown",
    };

    setLoading(true);

    if (nodes.length === 0) {
      const address = await generateAddress(newNode);

      newNode.address = address;
      await addNode(newNode);
      await createGenesis();
      await sleep(10000);
      newNode.enode = await getNodeEnode(newNode);
    }

    await createNode(newNode);

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
                    errorMessage="Please, enter a valid node name"
                    label="Node Name"
                    labelPlacement="outside"
                    name="newNodeName"
                    placeholder="Enter the name for the new node you want to create"
                    type="text"
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
