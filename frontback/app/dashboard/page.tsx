"use client";

import React from "react";
import {
  Alert,
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  User,
  Chip,
  Tooltip,
  addToast,
} from "@heroui/react";
import { Node } from "@dalzemag/besu-clique";

import Network from "../../components/network";
import {
  checkDocker,
  getNodeStatus,
  startNode,
  stopNode,
  getNetworkName,
  setNetworkName,
} from "../services/network";
import { checkMongoDB } from "../services/mongodb/db";

interface CompleteNode extends Node {
  status: "active" | "stoped" | "unknown";
}

interface ErrorMsg {
  title: string | null;
  content: string | null;
  type:
    | "success"
    | "danger"
    | "warning"
    | "default"
    | "foreground"
    | "primary"
    | "secondary"
    | undefined;
}

export const columns = [
  { name: "NAME", uid: "name" },
  { name: "PORTS", uid: "ports" },
  { name: "STATUS", uid: "status" },
  { name: "ACTIONS", uid: "actions" },
];

export const mockNodes: CompleteNode[] = [
  {
    name: "Node1",
    portJSON: 8545,
    portWS: 8546,
    portP2P: 30303,
    address: "0x1234567890...",
    status: "active",
  },
  {
    name: "Node2",
    portJSON: 8555,
    portWS: 8556,
    portP2P: 30304,
    address: "0x1234567890...",
    status: "stoped",
  },
  {
    name: "Node3",
    portJSON: 8565,
    portWS: 8566,
    portP2P: 30305,
    address: "0x1234567890...",
    status: "unknown",
  },
  {
    name: "Node4",
    portJSON: 8575,
    portWS: 8576,
    portP2P: 30306,
    address: "0x1234567890...",
    status: "stoped",
  },
];

export const users = [
  {
    id: 1,
    name: "Tony Reichert",
    role: "CEO",
    team: "Management",
    status: "active",
    age: "29",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
    email: "tony.reichert@example.com",
  },
  {
    id: 2,
    name: "Zoey Lang",
    role: "Technical Lead",
    team: "Development",
    status: "paused",
    age: "25",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
    email: "zoey.lang@example.com",
  },
  {
    id: 3,
    name: "Jane Fisher",
    role: "Senior Developer",
    team: "Development",
    status: "active",
    age: "22",
    avatar: "https://i.pravatar.cc/150?u=a04258114e29026702d",
    email: "jane.fisher@example.com",
  },
  {
    id: 4,
    name: "William Howard",
    role: "Community Manager",
    team: "Marketing",
    status: "vacation",
    age: "28",
    avatar: "https://i.pravatar.cc/150?u=a048581f4e29026701d",
    email: "william.howard@example.com",
  },
  {
    id: 5,
    name: "Kristen Copper",
    role: "Sales Manager",
    team: "Sales",
    status: "active",
    age: "24",
    avatar: "https://i.pravatar.cc/150?u=a092581d4ef9026700d",
    email: "kristen.cooper@example.com",
  },
];

export const EyeIcon = (props: Object) => {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height="1em"
      role="presentation"
      viewBox="0 0 20 20"
      width="1em"
      {...props}
    >
      <path
        d="M12.9833 10C12.9833 11.65 11.65 12.9833 10 12.9833C8.35 12.9833 7.01666 11.65 7.01666 10C7.01666 8.35 8.35 7.01666 10 7.01666C11.65 7.01666 12.9833 8.35 12.9833 10Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
      <path
        d="M9.99999 16.8916C12.9417 16.8916 15.6833 15.1583 17.5917 12.1583C18.3417 10.9833 18.3417 9.00831 17.5917 7.83331C15.6833 4.83331 12.9417 3.09998 9.99999 3.09998C7.05833 3.09998 4.31666 4.83331 2.40833 7.83331C1.65833 9.00831 1.65833 10.9833 2.40833 12.1583C4.31666 15.1583 7.05833 16.8916 9.99999 16.8916Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
    </svg>
  );
};

export const DeleteIcon = (props: Object) => {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height="1em"
      role="presentation"
      viewBox="0 0 20 20"
      width="1em"
      {...props}
    >
      <path
        d="M17.5 4.98332C14.725 4.70832 11.9333 4.56665 9.15 4.56665C7.5 4.56665 5.85 4.64998 4.2 4.81665L2.5 4.98332"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
      <path
        d="M7.08331 4.14169L7.26665 3.05002C7.39998 2.25835 7.49998 1.66669 8.90831 1.66669H11.0916C12.5 1.66669 12.6083 2.29169 12.7333 3.05835L12.9166 4.14169"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
      <path
        d="M15.7084 7.61664L15.1667 16.0083C15.075 17.3166 15 18.3333 12.675 18.3333H7.32502C5.00002 18.3333 4.92502 17.3166 4.83335 16.0083L4.29169 7.61664"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
      <path
        d="M8.60834 13.75H11.3833"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
      <path
        d="M7.91669 10.4167H12.0834"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
    </svg>
  );
};

export const PlayIcon = (props: Object) => {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height="1em"
      role="presentation"
      viewBox="0 0 20 20"
      width="1em"
      {...props}
    >
      <path
        d="M15.8333 10L4.16667 15.8333V4.16667L15.8333 10Z"
        fill="currentColor"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        rx="2"
        strokeWidth={1.5}
      />
    </svg>
  );
};

export const StopIcon = (props: Object) => {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height="1em"
      role="presentation"
      viewBox="0 0 20 20"
      width="1em"
      {...props}
    >
      <rect x="3" y="3" width="13" height="13" rx="2" fill="currentColor" />
    </svg>
  );
};

export const EditIcon = (props: Object) => {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height="1em"
      role="presentation"
      viewBox="0 0 20 20"
      width="1em"
      {...props}
    >
      <path
        d="M11.05 3.00002L4.20835 10.2417C3.95002 10.5167 3.70002 11.0584 3.65002 11.4334L3.34169 14.1334C3.23335 15.1084 3.93335 15.775 4.90002 15.6084L7.58335 15.15C7.95835 15.0834 8.48335 14.8084 8.74168 14.525L15.5834 7.28335C16.7667 6.03335 17.3 4.60835 15.4583 2.86668C13.625 1.14168 12.2334 1.75002 11.05 3.00002Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeMiterlimit={10}
        strokeWidth={1.5}
      />
      <path
        d="M9.90833 4.20831C10.2667 6.50831 12.1333 8.26665 14.45 8.49998"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeMiterlimit={10}
        strokeWidth={1.5}
      />
      <path
        d="M2.5 18.3333H17.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeMiterlimit={10}
        strokeWidth={1.5}
      />
    </svg>
  );
};

const statusColorMap: {
  [key: string]:
    | "success"
    | "danger"
    | "warning"
    | "default"
    | "primary"
    | "secondary"
    | undefined;
} = {
  active: "success",
  stoped: "danger",
  unknown: "warning",
};

export default function Dashboard() {
  const [dockerStatus, setDockerStatus] = React.useState<boolean>(false);
  const [netName, setNetName] = React.useState<string | null>(null);
  const [nodes, setNodes] = React.useState<CompleteNode[]>(mockNodes);
  const [statusLoading, setStatusLoading] = React.useState<boolean>(true);
  const [message, setMessage] = React.useState<ErrorMsg | null>(null);

  const checkDockerStatus = async () => {
    try {
      setStatusLoading(true);
      const status = await checkDocker();

      setDockerStatus(status);
      setStatusLoading(false);
    } catch (error) {
      setMessage({
        title: `Error checking docker status`,
        content: `${error}`,
        type: "danger",
      });
    }
  };

  const refreshNetworkName = async () => {
    try {
      setStatusLoading(true);
      const netName = await getNetworkName();

      setNetName(netName);
      setStatusLoading(false);
    } catch (error) {
      setMessage({
        title: `Error getting network name`,
        content: `${error}`,
        type: "danger",
      });
    }
  };

  const callCheckMongoDB = async () => {
    const res = await checkMongoDB();

    if (res) {
      console.log("MongoDB is running");
    } else {
      console.log("MongoDB is not running");
    }
  };

  const callStartNode = async (node: Node) => {
    // console.log("callStartNode", node);
    setStatusLoading(true);
    await startNode(node);
    await refreshNodesStatus();
    setMessage({
      title: `${node.name} started`,
      content: `${node.name} started successfully`,
      type: "success",
    });
  };

  const callStopNode = async (node: Node) => {
    // console.log("callStopNode", node);
    try {
      setStatusLoading(true);
      await stopNode(node);
      await refreshNodesStatus();
      setMessage({
        title: `${node.name} stopped`,
        content: `${node.name} stopped successfully`,
        type: "success",
      });
    } catch (error) {
      setStatusLoading(false);
      setMessage({
        title: `Error Stopping node ${node.name}`,
        content: `${error}`,
        type: "danger",
      });
    }
  };

  const refreshNodesStatus = async () => {
    await Promise.all(
      nodes.map(async (node) => {
        // return await getNodeStatus(node);
        node.status = await getNodeStatus(node);
      })
    );

    setStatusLoading(false);
  };

  React.useEffect(() => {
    setStatusLoading(true);
    checkDockerStatus();
    // callCheckMongoDB();
    refreshNetworkName();
    refreshNodesStatus();

    // const intervalo = setInterval(() => {
    //   refreshNodeStatus();
    // }, 5000);

    // return () => clearInterval(intervalo);
  }, []);

  React.useEffect(() => {
    if (message) {
      addToast({
        title: message.title,
        description: message.content as string,
        variant: "bordered",
        color: message.type,
        timeout: 4000,
        shouldShowTimeoutProgress: true,
      });
    }
  }, [message]);

  const renderCell = React.useCallback(
    (node: CompleteNode, columnKey: string) => {
      const cellValue = node[columnKey as keyof CompleteNode];

      switch (columnKey) {
        case "name":
          return (
            <User
              avatarProps={{ radius: "lg", src: node.dockerId }}
              description={node.address}
              name={cellValue}
            >
              {node.dockerId}
            </User>
          );
        case "ports":
          return (
            <div className="flex flex-col">
              <p className="text-bold text-sm capitalize">
                {node.portJSON}, {node.portWS}, {node.portP2P}
              </p>
            </div>
          );
        case "status":
          return (
            <Chip
              className="capitalize"
              color={statusColorMap[node.status]}
              size="sm"
              variant="flat"
            >
              {cellValue}
            </Chip>
          );
        case "actions":
          return (
            <div className="relative flex items-center justify-center gap-2">
              <Tooltip color="primary" content="Play">
                <span className="text-lg text-default-400 cursor-pointer active:opacity-50">
                  <button onClick={() => callStartNode(node)}>
                    <PlayIcon />
                  </button>
                </span>
              </Tooltip>
              <Tooltip color="primary" content="Stop">
                <span className="text-lg text-default-400 cursor-pointer active:opacity-50">
                  <button onClick={() => callStopNode(node)}>
                    <StopIcon />
                  </button>
                </span>
              </Tooltip>
              <Tooltip color="danger" content="Delete">
                <span className="text-lg text-danger cursor-pointer active:opacity-50">
                  <DeleteIcon />
                </span>
              </Tooltip>
            </div>
          );
        default:
          return cellValue;
      }
    },
    []
  );

  if (dockerStatus === false) {
    return (
      <div className="text-center">
        <Alert
          className="text-justify max-w-md mx-auto"
          color="warning"
          description="This application needs Docker to work, please,check if Docker is
          nunning locally and try again."
          title="Checking if Docker is running..."
        />
        <Button className="mt-4" color="warning" onPress={checkDockerStatus}>
          Check Docker
        </Button>
      </div>
    );
  }

  if (statusLoading) {
    return <div className="text-center">Loading...</div>;
  }

  return (
    <>
      <Network netName="besuClique" />
      <Table aria-label="Example table with custom cells" className="w-full">
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn
              key={column.uid}
              align={column.uid === "actions" ? "center" : "start"}
            >
              {column.name}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody items={nodes}>
          {(item) => (
            <TableRow key={item.name}>
              {(columnKey) => (
                <TableCell>{renderCell(item, columnKey as string)}</TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
  );
}
