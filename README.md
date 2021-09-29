# sanity-plugin-markdown
A Markdown editor with preview for Sanity Studio. Supports Github flavored markdown and image uploads. You can either drag image(s) into the editor or click the bottom bar to bring up a file selector. The inserted image(s) has a default width crop in the url which you can change to your liking with the [Sanity image pipeline parameters](https://www.sanity.io/docs/image-urls).

## Installation

```
sanity install markdown-full
```

## Usage
Declare a field in your schema to be `markdown`

```javascript
const myDocument = {
  type: "document",
  name: "myDocument",
  fields: [
    {
      type: "markdown",
      description: "A Github flavored markdown field with image uploading",
      name: "bio"
    }
  ]
}
```
### Demo

![Demo](https://user-images.githubusercontent.com/76360/135316429-f5bb1fea-a925-4721-9dfa-d693091ae8d1.gif)


## License

MIT © Sanity.io
See LICENSE
