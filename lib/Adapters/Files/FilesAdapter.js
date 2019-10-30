"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.validateFilename = validateFilename;
exports.default = exports.FilesAdapter = void 0;

var _node = _interopRequireDefault(require("parse/node"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*eslint no-unused-vars: "off"*/
// Files Adapter
//
// Allows you to change the file storage mechanism.
//
// Adapter classes must implement the following functions:
// * createFile(filename, data, contentType)
// * deleteFile(filename)
// * getFileData(filename)
// * getFileLocation(config, filename)
// Adapter classes should implement the following functions:
// * validateFilename(filename)
// * handleFileStream(filename, req, res, contentType)
//
// Default is GridFSBucketAdapter, which requires mongo
// and for the API server to be using the DatabaseController with Mongo
// database adapter.

/**
 * @module Adapters
 */

/**
 * @interface FilesAdapter
 */
class FilesAdapter {
  /** Responsible for storing the file in order to be retrieved later by its filename
   *
   * @param {string} filename - the filename to save
   * @param {*} data - the buffer of data from the file
   * @param {string} contentType - the supposed contentType
   * @discussion the contentType can be undefined if the controller was not able to determine it
   *
   * @return {Promise} a promise that should fail if the storage didn't succeed
   */
  createFile(filename, data, contentType) {}
  /** Responsible for deleting the specified file
   *
   * @param {string} filename - the filename to delete
   *
   * @return {Promise} a promise that should fail if the deletion didn't succeed
   */


  deleteFile(filename) {}
  /** Responsible for retrieving the data of the specified file
   *
   * @param {string} filename - the name of file to retrieve
   *
   * @return {Promise} a promise that should pass with the file data or fail on error
   */


  getFileData(filename) {}
  /** Returns an absolute URL where the file can be accessed
   *
   * @param {Config} config - server configuration
   * @param {string} filename
   *
   * @return {string} Absolute URL
   */


  getFileLocation(config, filename) {}
  /** Validate a filename for this adapter type
   *
   * @param {string} filename
   *
   * @returns {null|string} error message or null if there are no errors
   */
  // validateFilename(filename: string): ?string {}

  /** Handles Byte-Range Requests for Streaming
   *
   * @param {string} filename
   * @param {object} req
   * @param {object} res
   * @param {string} contentType
   *
   * @returns {Promise} Data for byte range
   */
  // handleFileStream(filename: string, res: any, req: any, contentType: string): Promise


}
/**
 * Simple filename validation
 *
 * @param filename
 * @returns {null|Parse.Error}
 */


exports.FilesAdapter = FilesAdapter;

function validateFilename(filename) {
  if (filename.length > 128) {
    return 'Filename too long.';
  }

  const regx = /^[_a-zA-Z0-9][a-zA-Z0-9@. ~_-]*$/;

  if (!filename.match(regx)) {
    return 'Filename contains invalid characters.';
  }

  return null;
}

var _default = FilesAdapter;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9BZGFwdGVycy9GaWxlcy9GaWxlc0FkYXB0ZXIuanMiXSwibmFtZXMiOlsiRmlsZXNBZGFwdGVyIiwiY3JlYXRlRmlsZSIsImZpbGVuYW1lIiwiZGF0YSIsImNvbnRlbnRUeXBlIiwiZGVsZXRlRmlsZSIsImdldEZpbGVEYXRhIiwiZ2V0RmlsZUxvY2F0aW9uIiwiY29uZmlnIiwidmFsaWRhdGVGaWxlbmFtZSIsImxlbmd0aCIsInJlZ3giLCJtYXRjaCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFtQkE7Ozs7QUFuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFJQTs7OztBQUdBOzs7QUFHTyxNQUFNQSxZQUFOLENBQW1CO0FBQ3hCOzs7Ozs7Ozs7QUFTQUMsRUFBQUEsVUFBVSxDQUFDQyxRQUFELEVBQW1CQyxJQUFuQixFQUF5QkMsV0FBekIsRUFBdUQsQ0FBRTtBQUVuRTs7Ozs7Ozs7QUFNQUMsRUFBQUEsVUFBVSxDQUFDSCxRQUFELEVBQTRCLENBQUU7QUFFeEM7Ozs7Ozs7O0FBTUFJLEVBQUFBLFdBQVcsQ0FBQ0osUUFBRCxFQUFpQyxDQUFFO0FBRTlDOzs7Ozs7Ozs7QUFPQUssRUFBQUEsZUFBZSxDQUFDQyxNQUFELEVBQWlCTixRQUFqQixFQUEyQyxDQUFFO0FBRTVEOzs7Ozs7QUFNQTs7QUFFQTs7Ozs7Ozs7O0FBU0E7OztBQXREd0I7QUF5RDFCOzs7Ozs7Ozs7O0FBTU8sU0FBU08sZ0JBQVQsQ0FBMEJQLFFBQTFCLEVBQWtEO0FBQ3ZELE1BQUlBLFFBQVEsQ0FBQ1EsTUFBVCxHQUFrQixHQUF0QixFQUEyQjtBQUN6QixXQUFPLG9CQUFQO0FBQ0Q7O0FBRUQsUUFBTUMsSUFBSSxHQUFHLGtDQUFiOztBQUNBLE1BQUksQ0FBQ1QsUUFBUSxDQUFDVSxLQUFULENBQWVELElBQWYsQ0FBTCxFQUEyQjtBQUN6QixXQUFPLHVDQUFQO0FBQ0Q7O0FBQ0QsU0FBTyxJQUFQO0FBQ0Q7O2VBRWNYLFkiLCJzb3VyY2VzQ29udGVudCI6WyIvKmVzbGludCBuby11bnVzZWQtdmFyczogXCJvZmZcIiovXG4vLyBGaWxlcyBBZGFwdGVyXG4vL1xuLy8gQWxsb3dzIHlvdSB0byBjaGFuZ2UgdGhlIGZpbGUgc3RvcmFnZSBtZWNoYW5pc20uXG4vL1xuLy8gQWRhcHRlciBjbGFzc2VzIG11c3QgaW1wbGVtZW50IHRoZSBmb2xsb3dpbmcgZnVuY3Rpb25zOlxuLy8gKiBjcmVhdGVGaWxlKGZpbGVuYW1lLCBkYXRhLCBjb250ZW50VHlwZSlcbi8vICogZGVsZXRlRmlsZShmaWxlbmFtZSlcbi8vICogZ2V0RmlsZURhdGEoZmlsZW5hbWUpXG4vLyAqIGdldEZpbGVMb2NhdGlvbihjb25maWcsIGZpbGVuYW1lKVxuLy8gQWRhcHRlciBjbGFzc2VzIHNob3VsZCBpbXBsZW1lbnQgdGhlIGZvbGxvd2luZyBmdW5jdGlvbnM6XG4vLyAqIHZhbGlkYXRlRmlsZW5hbWUoZmlsZW5hbWUpXG4vLyAqIGhhbmRsZUZpbGVTdHJlYW0oZmlsZW5hbWUsIHJlcSwgcmVzLCBjb250ZW50VHlwZSlcbi8vXG4vLyBEZWZhdWx0IGlzIEdyaWRGU0J1Y2tldEFkYXB0ZXIsIHdoaWNoIHJlcXVpcmVzIG1vbmdvXG4vLyBhbmQgZm9yIHRoZSBBUEkgc2VydmVyIHRvIGJlIHVzaW5nIHRoZSBEYXRhYmFzZUNvbnRyb2xsZXIgd2l0aCBNb25nb1xuLy8gZGF0YWJhc2UgYWRhcHRlci5cblxuaW1wb3J0IHR5cGUgeyBDb25maWcgfSBmcm9tICcuLi8uLi9Db25maWcnO1xuaW1wb3J0IFBhcnNlIGZyb20gJ3BhcnNlL25vZGUnO1xuLyoqXG4gKiBAbW9kdWxlIEFkYXB0ZXJzXG4gKi9cbi8qKlxuICogQGludGVyZmFjZSBGaWxlc0FkYXB0ZXJcbiAqL1xuZXhwb3J0IGNsYXNzIEZpbGVzQWRhcHRlciB7XG4gIC8qKiBSZXNwb25zaWJsZSBmb3Igc3RvcmluZyB0aGUgZmlsZSBpbiBvcmRlciB0byBiZSByZXRyaWV2ZWQgbGF0ZXIgYnkgaXRzIGZpbGVuYW1lXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBmaWxlbmFtZSAtIHRoZSBmaWxlbmFtZSB0byBzYXZlXG4gICAqIEBwYXJhbSB7Kn0gZGF0YSAtIHRoZSBidWZmZXIgb2YgZGF0YSBmcm9tIHRoZSBmaWxlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb250ZW50VHlwZSAtIHRoZSBzdXBwb3NlZCBjb250ZW50VHlwZVxuICAgKiBAZGlzY3Vzc2lvbiB0aGUgY29udGVudFR5cGUgY2FuIGJlIHVuZGVmaW5lZCBpZiB0aGUgY29udHJvbGxlciB3YXMgbm90IGFibGUgdG8gZGV0ZXJtaW5lIGl0XG4gICAqXG4gICAqIEByZXR1cm4ge1Byb21pc2V9IGEgcHJvbWlzZSB0aGF0IHNob3VsZCBmYWlsIGlmIHRoZSBzdG9yYWdlIGRpZG4ndCBzdWNjZWVkXG4gICAqL1xuICBjcmVhdGVGaWxlKGZpbGVuYW1lOiBzdHJpbmcsIGRhdGEsIGNvbnRlbnRUeXBlOiBzdHJpbmcpOiBQcm9taXNlIHt9XG5cbiAgLyoqIFJlc3BvbnNpYmxlIGZvciBkZWxldGluZyB0aGUgc3BlY2lmaWVkIGZpbGVcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGZpbGVuYW1lIC0gdGhlIGZpbGVuYW1lIHRvIGRlbGV0ZVxuICAgKlxuICAgKiBAcmV0dXJuIHtQcm9taXNlfSBhIHByb21pc2UgdGhhdCBzaG91bGQgZmFpbCBpZiB0aGUgZGVsZXRpb24gZGlkbid0IHN1Y2NlZWRcbiAgICovXG4gIGRlbGV0ZUZpbGUoZmlsZW5hbWU6IHN0cmluZyk6IFByb21pc2Uge31cblxuICAvKiogUmVzcG9uc2libGUgZm9yIHJldHJpZXZpbmcgdGhlIGRhdGEgb2YgdGhlIHNwZWNpZmllZCBmaWxlXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBmaWxlbmFtZSAtIHRoZSBuYW1lIG9mIGZpbGUgdG8gcmV0cmlldmVcbiAgICpcbiAgICogQHJldHVybiB7UHJvbWlzZX0gYSBwcm9taXNlIHRoYXQgc2hvdWxkIHBhc3Mgd2l0aCB0aGUgZmlsZSBkYXRhIG9yIGZhaWwgb24gZXJyb3JcbiAgICovXG4gIGdldEZpbGVEYXRhKGZpbGVuYW1lOiBzdHJpbmcpOiBQcm9taXNlPGFueT4ge31cblxuICAvKiogUmV0dXJucyBhbiBhYnNvbHV0ZSBVUkwgd2hlcmUgdGhlIGZpbGUgY2FuIGJlIGFjY2Vzc2VkXG4gICAqXG4gICAqIEBwYXJhbSB7Q29uZmlnfSBjb25maWcgLSBzZXJ2ZXIgY29uZmlndXJhdGlvblxuICAgKiBAcGFyYW0ge3N0cmluZ30gZmlsZW5hbWVcbiAgICpcbiAgICogQHJldHVybiB7c3RyaW5nfSBBYnNvbHV0ZSBVUkxcbiAgICovXG4gIGdldEZpbGVMb2NhdGlvbihjb25maWc6IENvbmZpZywgZmlsZW5hbWU6IHN0cmluZyk6IHN0cmluZyB7fVxuXG4gIC8qKiBWYWxpZGF0ZSBhIGZpbGVuYW1lIGZvciB0aGlzIGFkYXB0ZXIgdHlwZVxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZmlsZW5hbWVcbiAgICpcbiAgICogQHJldHVybnMge251bGx8c3RyaW5nfSBlcnJvciBtZXNzYWdlIG9yIG51bGwgaWYgdGhlcmUgYXJlIG5vIGVycm9yc1xuICAgKi9cbiAgLy8gdmFsaWRhdGVGaWxlbmFtZShmaWxlbmFtZTogc3RyaW5nKTogP3N0cmluZyB7fVxuXG4gIC8qKiBIYW5kbGVzIEJ5dGUtUmFuZ2UgUmVxdWVzdHMgZm9yIFN0cmVhbWluZ1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZmlsZW5hbWVcbiAgICogQHBhcmFtIHtvYmplY3R9IHJlcVxuICAgKiBAcGFyYW0ge29iamVjdH0gcmVzXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb250ZW50VHlwZVxuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gRGF0YSBmb3IgYnl0ZSByYW5nZVxuICAgKi9cbiAgLy8gaGFuZGxlRmlsZVN0cmVhbShmaWxlbmFtZTogc3RyaW5nLCByZXM6IGFueSwgcmVxOiBhbnksIGNvbnRlbnRUeXBlOiBzdHJpbmcpOiBQcm9taXNlXG59XG5cbi8qKlxuICogU2ltcGxlIGZpbGVuYW1lIHZhbGlkYXRpb25cbiAqXG4gKiBAcGFyYW0gZmlsZW5hbWVcbiAqIEByZXR1cm5zIHtudWxsfFBhcnNlLkVycm9yfVxuICovXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVGaWxlbmFtZShmaWxlbmFtZSk6ID9QYXJzZS5FcnJvciB7XG4gIGlmIChmaWxlbmFtZS5sZW5ndGggPiAxMjgpIHtcbiAgICByZXR1cm4gJ0ZpbGVuYW1lIHRvbyBsb25nLic7XG4gIH1cblxuICBjb25zdCByZWd4ID0gL15bX2EtekEtWjAtOV1bYS16QS1aMC05QC4gfl8tXSokLztcbiAgaWYgKCFmaWxlbmFtZS5tYXRjaChyZWd4KSkge1xuICAgIHJldHVybiAnRmlsZW5hbWUgY29udGFpbnMgaW52YWxpZCBjaGFyYWN0ZXJzLic7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmV4cG9ydCBkZWZhdWx0IEZpbGVzQWRhcHRlcjtcbiJdfQ==