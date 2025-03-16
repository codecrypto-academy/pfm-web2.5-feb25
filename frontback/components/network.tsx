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

import { createNetwork } from "@/app/services/network";

interface IProps {
  netName: string;
}

export default function Network(props: IProps) {
  const { netName } = props;
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [errors, setErrors] = useState({});

  const callCreateNetwork = async (e: {
    preventDefault: () => void;
    currentTarget: HTMLFormElement | undefined;
  }) => {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(e.currentTarget));

    if (!data.networkName) {
      setErrors({ networkName: "networkName is required" });

      return;
    }

    // const result = callServer(data);
    const newName = data.networkName;

    const resp = await createNetwork(newName as string);
    console.log(JSON.stringify(newName));
    console.log(resp);
    onOpenChange();

    // setErrors(result.errors);
  };

  // if (!netName) {
  //   return (
  //     <div className="py-8">
  //       <Button onPress={callCreateNetwork}>Create network</Button>
  //     </div>
  //   );
  // }

  return (
    <>
      <div className="py-8 text-2xl">
        <div>
          <span>
            Network: <span className="font-bold">{netName}</span>
          </span>
          <Button className="mx-8" color="primary" onPress={onOpen}>
            Change Network
          </Button>
        </div>
      </div>
      <Modal backdrop="opaque" isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Modal Title
              </ModalHeader>
              <ModalBody>
                <Form validationErrors={errors} onSubmit={callCreateNetwork}>
                  <Input
                    isRequired
                    errorMessage="Please, enter a valid network name"
                    label="Network Name"
                    labelPlacement="outside"
                    name="networkName"
                    placeholder="Enter the network name"
                    type="text"
                  />
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
