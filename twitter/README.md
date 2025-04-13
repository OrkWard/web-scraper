**Table of Contents**

- [Usage](#Usage)
  - [As a cli](#As-a-cli)
  - [As a lib](#as-a-lib)

## Usage

### As a cli

> `https_proxy`, `all_proxy` supported.

Download all medias of `username` to `./output/<username>` directory (interrupt supported):

```shell
twitter-scraper <username>
```

With limit:

```shell
twitter-scraper <username> -l 20
```

Only video:

```shell
twitter-scraper <username> -v
```

Only image:

```shell
twitter-scraper <username> -i
```

### As a library

> `https_proxy`, `all_proxy` automatically regarded.

```ts
import { prepareAPI, getTweetMedia } from 'twitter-scraper';

// need async init to get api
const { getUserId, getUserTweets, getUserMedia } = await prepareAPI({
  cookie: // Your cookie
  "user-agent": // Your UA
  "x-csrf-token": // Your CSRF token
  Authorization: // Your Authorization
})

// get userId from username
const userId = await getUserId("username")

// get latest 20 tweets (pin tweet not included)
const tweets = await getUserTweets(userId, 20)

// get user medias start from certain position (default latest)
const medias = await getUserMedia(userId, "<cursor>")
```

## API

### `prepareAPI(loginInfo)`

- loginInfo: an object contain cookies, authorizations, etc.
  > **Returns**: a Promise contains all supported twitter api. See [Twitter API](#twitter-api)

## Twitter API

### `getUserId(username)`

- username: a string
  > **Returns**: a string contains the user's internal id, for use in other api

### `getUserTweets(userId[, count])`

- userId: internal id
- count: default 20
  > **Returns**: An array of type `TweetEntry`. This struct is too complicated to explain here, just read the code.

### `getUserMedia(userId[, topCursor])`

- userId: internal id
- topCursor: start position, you can get this infomation for the api itself. If not provided, just get the lastest medias.
  > **Returns**: an object in the shape { cursor, imgs, videos }.
  >
  > - cursor: the bottom position cursor, for using in get next batch
  > - imgs: all images in the batch (20 tweets a batch)
  > - videos: all videos in the batch
