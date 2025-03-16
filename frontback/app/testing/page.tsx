"use client";

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
// import { title } from "@/components/primitives";
import { useEffect, useState } from "react";

import { checkDocker } from "./actions";

export default function DashboardPage() {
  const [dockerExists, setDockerExists] = useState("");

  useEffect(() => {
    checkDocker().then((resp) => {
      setDockerExists(resp ? "installed" : "not installed");
    });
  }, []);

  return (
    <>
      <div className="flex flex-row">
        <div className="w-full bg-blue-300 m-4 rounded-md text-black">R1C1</div>
        <div className="w-full bg-blue-300 m-4 rounded-md text-black">R1C2</div>
        <div className="w-full bg-blue-300 m-4 rounded-md text-black">R1C3</div>
      </div>
    </>
  );
}
