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

This project includes 5000 Turkish books for free. I used Cloudinary to fetch and uplaod new books.
The books are searchable. Also you can get all the books and monitor the last books that added to the library. If the user can not find the book in the library, he/she can add in shelf space a comment to get help from other users. Other users can contribute to the library without any limitation. 


Project mainly builded with in frontend(ReactJS), backend(NodeJS) and also deploy to kubernetes cluser(which is in rancher). In addition i deployed the app to the vercel. So the app now running in both kuberntes cluster and vercel. After you open a pull request, the tests will run and will wait your pr to be approved. After pr is merged, the app will be build and push to docker hub and vercel at the same time. After the building of the app finish in github actions, the kubernetes cluster will be trigger again to run new image that we pushed to dockerhub. So the kubernetes cluster will use the new image that we pushed to dockerhub. You can run the app in your local also using docker, but you need to get your own cloudinary secret key and add it to env file. 

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
