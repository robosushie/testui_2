// This (along with a transform in package.json) allows us to import
// less files directly into the components that consume them (like ModalLoader)
// https://stackoverflow.com/questions/37072641/make-jest-ignore-the-less-import-when-testing
module.exports = {
    process() {
      return "";
    }
}