<div align="center" id="top"> 
  <img src="./.github/app.gif" alt="Shorturl" />

&#xa0;

  <!-- <a href="https://shorturl.netlify.app">Demo</a> -->
</div>

<h1 align="center">BOOK WORMS</h1>

<p align="center">
  <img alt="Github top language" src="https://img.shields.io/github/languages/top/{{YOUR_GITHUB_USERNAME}}/shorturl?color=56BEB8">

  <img alt="Github language count" src="https://img.shields.io/github/languages/count/{{YOUR_GITHUB_USERNAME}}/shorturl?color=56BEB8">

  <img alt="Repository size" src="https://img.shields.io/github/repo-size/{{YOUR_GITHUB_USERNAME}}/shorturl?color=56BEB8">

  <img alt="License" src="https://img.shields.io/github/license/{{YOUR_GITHUB_USERNAME}}/shorturl?color=56BEB8">

  <!-- <img alt="Github issues" src="https://img.shields.io/github/issues/{{YOUR_GITHUB_USERNAME}}/shorturl?color=56BEB8" /> -->

  <!-- <img alt="Github forks" src="https://img.shields.io/github/forks/{{YOUR_GITHUB_USERNAME}}/shorturl?color=56BEB8" /> -->

  <!-- <img alt="Github stars" src="https://img.shields.io/github/stars/{{YOUR_GITHUB_USERNAME}}/shorturl?color=56BEB8" /> -->
</p>

<!-- Status -->

<!-- <h4 align="center">
	🚧  Shorturl 🚀 Under construction...  🚧
</h4>

<hr> -->

<p align="center">
  <a href="#dart-about">About</a> &#xa0; | &#xa0; 
  <a href="#sparkles-features">Features</a> &#xa0; | &#xa0;
  <a href="#rocket-technologies">Technologies</a> &#xa0; | &#xa0;
  <a href="#white_check_mark-requirements">Requirements</a> &#xa0; | &#xa0;
  <a href="#checkered_flag-starting">Starting</a> &#xa0; | &#xa0;
  <a href="#memo-license">License</a> &#xa0; | &#xa0;
  <a href="https://github.com/sayinmehmet47" target="_blank">Author</a>
</p>

<br>

## :dart: About

This project comprises 5000 Turkish books available for free. I used Cloudinary to fetch and upload new books. The books are searchable, and you can access the entire library as well as monitor the latest additions. If a user cannot find a specific book in the library, they can add a comment to request assistance from other users. Other users can contribute to the library without limitations. The admin has a distinct role that allows them to delete comments and books.

The project is primarily built using ReactJS for the frontend, NodeJS for the backend, and is deployed on a Kubernetes cluster within Rancher. Additionally, I have deployed the app on Vercel, making it accessible from both the Kubernetes cluster and Vercel. When you open a pull request, automated tests will run, and your pull request will be awaiting approval. After the pull request is merged, the app will be built and simultaneously pushed to Docker Hub and Vercel. Following the completion of the app's building process in GitHub Actions, the Kubernetes cluster will be triggered to run the new image we pushed to Docker Hub, ensuring it uses the latest version. You can also run the app locally using Docker, but you'll need to obtain your own MongoDB,Cloudinary secrets and add it to the environment file.
For updating the npm package, i used as a bot renovate. It opens pr for the outdated package periodically

This project is my side project, where I mostly implement new concepts and technologies I've learned. It covers most of the technologies required for a real-world application. Currently, there are 112 active users registered with and using this app.

## :sparkles: Features

:heavy_check_mark: You can install more than 7000 books free with one click

:heavy_check_mark: Books are in e-pub format

:heavy_check_mark: Logged in user can add new books

## :rocket: Technologies

The following tools were used in this project:

- [x] ReactJS
- [x] Bootsrap-5
- [x] MongoDB
- [x] Typescript
- [x] NodeJS
- [x] Kubernetes
- [x] Github Actions
- [x] Integration test for backend
- [x] Prometheus
- [x] Graphana
- [x] Renovate
- [x] Docker
- [x] Cronjob

## :white_check_mark: Requirements

Before starting :checkered_flag:, you need to have [Git](https://git-scm.com) and [Node](https://nodejs.org/en/) installed.

## :checkered_flag: Starting

```bash
# Clone this project
$ git clone https://github.com/sayinmehmet47/kitapKurdu.git


$ cd client
$ npm install
$ npm run start

// in another terminal

$ cd backend

$ npm install
$ npm run start

#create a env file and attach your mongodb url


$ cd ..






# The server will initialize in the <http://localhost:3000>
```

- to run graphana and prometheus

```bash
$ docker-compose up -d

Graphana will run on <http://localhost:4000>
Prometheus will run on <http://localhost:9090>

```
- This is how it shows the metrics from prometheus in graphana dashboard

![image](https://github.com/sayinmehmet47/kitapKurdu/assets/75525090/9ead309b-e96b-4306-88e9-61608b20f736)


- Renovate bot is working to update the dependecies authomatically


## :memo: License

This project is under license from MIT. For more details, see the [LICENSE](LICENSE.md) file.

Made with :heart: by <a href="https://github.com/sayinmehmet47" target="_blank">Mehmet Sayin</a>

&#xa0;

<a href="#top">Back to top</a>
