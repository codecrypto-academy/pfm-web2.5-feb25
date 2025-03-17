"use client";

import { button as buttonStyles } from "@heroui/theme";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider,
  Link,
} from "@heroui/react";

import { siteConfig } from "@/config/site";
import { title, subtitle } from "@/components/primitives";
import { GithubIcon } from "@/components/icons";

export default function Home() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-xl text-center justify-center">
        <span className={title()}>Create a&nbsp;</span>
        <span className={title({ color: "violet" })}>beautiful&nbsp;</span>
        <br />
        <span className={title()}>
          network regardless of your development experience.
        </span>
        <div className={subtitle({ class: "mt-4" })}>
          Beautiful, simple and easy Hyperledger Besu library.
        </div>
      </div>

      <div className="flex gap-3">
        <Link
          isExternal
          className={buttonStyles({
            color: "primary",
            radius: "full",
            variant: "shadow",
          })}
          href={siteConfig.links.docs}
        >
          Documentation
        </Link>
        <Link
          isExternal
          className={buttonStyles({ variant: "bordered", radius: "full" })}
          href={siteConfig.links.github}
        >
          <GithubIcon size={20} />
          GitHub
        </Link>
      </div>

      <div className="flex flex-col md:flex-row w-full justify-center gap-4 py-4">
        <div className="flex-1">
          <Card className="max-w-[400px]">
            <CardHeader className="flex gap-3">
              <div className="w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                1
              </div>
              <div className="flex flex-col">
                <p className="text-xl">Create the network</p>
                <p className="text-small text-default-500">
                  To start managing nodes
                </p>
              </div>
            </CardHeader>
            <Divider />
            <CardBody>
              <p>
                Go to the Dashboard and create a network, or start using default
                one, to start managing nodes.
              </p>
            </CardBody>
            <Divider />
            <CardFooter>
              <Link showAnchorIcon href="/dashboard">
                Dashboard
              </Link>
            </CardFooter>
          </Card>
        </div>
        <div className="flex-1">
          <Card className="max-w-[400px]">
            <CardHeader className="flex gap-3">
              <div className="w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                2
              </div>
              <div className="flex flex-col">
                <p className="text-xl">Create nodes</p>
                <p className="text-small text-default-500">
                  Nodes are the core of the network
                </p>
              </div>
            </CardHeader>
            <Divider />
            <CardBody>
              <p>Go to the Dashboard and create too many nodes as you need.</p>
              <p>
                You have to introduce the node name and the ports the node will
                use.
              </p>
            </CardBody>
            <Divider />
            <CardFooter>
              <Link showAnchorIcon href="/dashboard">
                Dashboard
              </Link>
            </CardFooter>
          </Card>
        </div>
        <div className="flex-1">
          <Card className="max-w-[400px]">
            <CardHeader className="flex gap-3">
              <div className="w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                3
              </div>
              <div className="flex flex-col">
                <p className="text-xl">Manage nodes</p>
                <p className="text-small text-default-500">
                  Nodes are the core of the network
                </p>
              </div>
            </CardHeader>
            <Divider />
            <CardBody>
              <p>Go to the Dashboard start, stop or delete nodes.</p>
              <p>
                Manage them as you need, you can also check the status of each
                node.
              </p>
            </CardBody>
            <Divider />
            <CardFooter>
              <Link showAnchorIcon href="/dashboard">
                Dashboard
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </section>
  );
}
