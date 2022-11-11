# hello-world-node
This is the code starter if we want to start Node.js app using Docker.

## Prerequisites
- Docker is already installed on your machine. How to install docker? check its [documentation](https://docs.docker.com/engine/install/).

## How to run
- Build the Docker image `docker build . -t hello-world-node:1.0`
- Run the container `docker run -p 3000:3000 -d hello-world-node:1.0`
- Optionally we can mount our local folder to the working directory inside the container `docker run -v "$(pwd)":/usr/src/app -p 3000:3000 -d hello-world-node:1.0`
- Open the browser, and check http://localhost:8080
