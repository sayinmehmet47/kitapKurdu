- Benchmarking for the nodejs server app with the following command:

```
ab -n 50 -c 500 http://localhost:5000/api/books/allBooks
```

- The result is:

```
Benchmarking localhost (be patient)
Completed 100 requests
Completed 200 requests
Completed 300 requests
Completed 400 requests
Completed 500 requests
Finished 500 requests


Server Software:
Server Hostname:        localhost
Server Port:            5000

Document Path:          /api/books/allBooks
Document Length:        3395 bytes

Concurrency Level:      50
Time taken for tests:   257.060 seconds
Complete requests:      500
Failed requests:        0
Total transferred:      1841000 bytes
HTML transferred:       1697500 bytes
Requests per second:    1.95 [#/sec] (mean)
Time per request:       25706.014 [ms] (mean)
Time per request:       514.120 [ms] (mean, across all concurrent requests)
Transfer rate:          6.99 [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        0    0   0.6      0       3
Processing:  1644 24854 9542.4  23450   61093
Waiting:     1643 24847 9543.1  23398   61089
Total:       1644 24855 9542.4  23452   61093

Percentage of the requests served within a certain time (ms)
  50%  23452
  66%  26752
  75%  28745
  80%  31372
  90%  36521
  95%  43263
  98%  53622
  99%  58453
 100%  61093 (longest request)

```

- process manager pm2 is used to run the nodejs server app in the background. The following command is used to start the nodejs server app:

```

pm2 start server.js

```

- pm2 show server command is used to show the status of the nodejs server app:

```

pm2 show server

```

- pm2 stop server command is used to stop the nodejs server app:

```

pm2 stop server

```

- pm2 delete server command is used to delete the nodejs server app:

```

pm2 delete server

```

- pm2 list command is used to list all the nodejs server apps:

```

pm2 list

```

- pm2 monit command is used to monitor the nodejs server app:

```

pm2 monit

```
