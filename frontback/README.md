# FrontBack - TFM Web 2.5 Feb'2025

A visual environment you can use to create and manage Hyperledged Besu networks.  

## Technologies Used

- [Next.js 14](https://nextjs.org/docs/getting-started)
- [HeroUI v2](https://heroui.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Tailwind Variants](https://tailwind-variants.org)
- [TypeScript](https://www.typescriptlang.org/)
- [Framer Motion](https://www.framer.com/motion/)
- [next-themes](https://github.com/pacocoursey/next-themes)
- [MongoDB](https://www.mongodb.com/)

## Installation 

Clone the repository, go to the `frontback` folder, install dependencies, and start the application: 

```bash
  git clone git@github.com:DaLZmG/pfm-web2.5-feb25.git
  cd frontback
  npm install
  npm run dev
```

Use your favourite browser to show the `Home page` at [`localhost:3000`](http://localhost:3000)

## How to Use

### Home

You can follow the instructions described at Home page to create a new network. 

<div style="position: relative; padding-bottom: 64.5933014354067%; height: 0;"><iframe src="https://www.loom.com/embed/651d11d8cb3948ce950698752365fb4f?sid=1980fa33-cb66-4492-8782-43859a41bf71" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></iframe></div>

### Decting Docker status

The application will check if Docker is running on your system each time you go into the Dashboard. 

<div style="position: relative; padding-bottom: 64.5933014354067%; height: 0;"><iframe src="https://www.loom.com/embed/513ce200a7ac4a06a94fd1597625bcad?sid=22d3fd36-9c12-4ca2-bec1-1551d9366736" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></iframe></div>

### Creating a network 

You can create a new network or swith to a previous created into the Dashboard.

<div style="position: relative; padding-bottom: 64.5933014354067%; height: 0;"><iframe src="https://www.loom.com/embed/28c69a1a63194898b6aae0800f281342?sid=6e936aea-0562-4143-853d-761afb76c306" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></iframe></div>

### Creating a node 

The first node you create will be considered as the 'master' node, and will serve others with its enode URL.

<div style="position: relative; padding-bottom: 64.5933014354067%; height: 0;"><iframe src="https://www.loom.com/embed/c7524c1bce8d4e679f7e33b431fe5d3a?sid=07ecd738-0326-4c42-97b4-4850cdb4910b" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></iframe></div>

### Creating other nodes

Each node you create after the first will be considered a 'slave' node and will use `enode` URL of the first to manage the P2P links. 

<div style="position: relative; padding-bottom: 64.5933014354067%; height: 0;"><iframe src="https://www.loom.com/embed/b7b689e66554423c931fc997fd17a3f4?sid=6d04970b-6cd1-4aa1-9817-dd369f34c006" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></iframe></div>

## Considerations

It's been a tremendous pleasure working on this project. I've learned a lot about React.js and Next.js. I'm sorry I didn't have more time, and I look forward to dedicating it to continuing to improve every aspect of it.

### Next.js

Next.js is a great framework for developing full-stack web applications. It greatly simplifies development and facilitates many dynamics that are difficult to manage with other frameworks.
Its ability to provide executable content on both the server and the client within the same application in the way it is designed makes it ideal for this type of project.

I think it's interesting to highlight some details I discovered during the development of this web application:

- Next.js works great when libraries are downloaded from npm, but it doesn't work when they're being developed and referenced locally. This is most likely due to its internal cache management. The fact is that when I initially tried to work with my `besuClique` library while referencing it locally, it gave me an error because it couldn't detect it. So I had to upload a version to `npm`. Once installed from there, the errors disappeared, and I was able to work with it.

### React.js 

React.js is a great tool, there's no doubt about it. It's the foundation of, and the technology that enables, countless projects.

Due to the nature of the project, it was interesting to discover that calling an interface element 'newNode' collided with the names of the internal elements that React.js uses, generating a strange error that quite surprised me.

## License

Licensed under the [MIT license](https://github.com/heroui-inc/next-app-template/blob/main/LICENSE).
