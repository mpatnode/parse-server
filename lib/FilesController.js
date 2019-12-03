"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.FilesController = void 0;

var _cryptoUtils = require("../cryptoUtils");

var _AdaptableController2 = _interopRequireDefault(require("./AdaptableController"));

var _FilesAdapter = _interopRequireWildcard(require("../Adapters/Files/FilesAdapter"));

var _path = _interopRequireDefault(require("path"));

var _mime = _interopRequireDefault(require("mime"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; if (obj != null) { var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var legacyFilesRegex = new RegExp('^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}-.*');

var FilesController =
/*#__PURE__*/
function (_AdaptableController) {
  _inherits(FilesController, _AdaptableController);

  function FilesController() {
    _classCallCheck(this, FilesController);

    return _possibleConstructorReturn(this, _getPrototypeOf(FilesController).apply(this, arguments));
  }

  _createClass(FilesController, [{
    key: "getFileData",
    value: function getFileData(config, filename) {
      return this.adapter.getFileData(filename);
    }
  }, {
    key: "createFile",
    value: function createFile(config, filename, data, contentType) {
      var extname = _path["default"].extname(filename);

      var hasExtension = extname.length > 0;

      if (!hasExtension && contentType && _mime["default"].getExtension(contentType)) {
        filename = filename + '.' + _mime["default"].getExtension(contentType);
      } else if (hasExtension && !contentType) {
        contentType = _mime["default"].getType(filename);
      }

      if (!this.options.preserveFileName) {
        filename = (0, _cryptoUtils.randomHexString)(32) + '_' + filename;
      }

      var location = this.adapter.getFileLocation(config, filename);
      return this.adapter.createFile(filename, data, contentType).then(function () {
        return Promise.resolve({
          url: location,
          name: filename
        });
      });
    }
  }, {
    key: "deleteFile",
    value: function deleteFile(config, filename) {
      return this.adapter.deleteFile(filename);
    }
    /**
     * Find file references in REST-format object and adds the url key
     * with the current mount point and app id.
     * Object may be a single object or list of REST-format objects.
     */

  }, {
    key: "expandFilesInObject",
    value: function expandFilesInObject(config, object) {
      var _this = this;

      if (object instanceof Array) {
        object.map(function (obj) {
          return _this.expandFilesInObject(config, obj);
        });
        return;
      }

      if (_typeof(object) !== 'object') {
        return;
      }

      for (var key in object) {
        var fileObject = object[key];

        if (fileObject && fileObject['__type'] === 'File') {
          if (fileObject['url']) {
            continue;
          }

          var filename = fileObject['name']; // all filenames starting with "tfss-" should be from files.parsetfss.com
          // all filenames starting with a "-" seperated UUID should be from files.parse.com
          // all other filenames have been migrated or created from Parse Server

          if (config.fileKey === undefined) {
            fileObject['url'] = this.adapter.getFileLocation(config, filename);
          } else {
            if (filename.indexOf('tfss-') === 0) {
              fileObject['url'] = 'http://files.parsetfss.com/' + config.fileKey + '/' + encodeURIComponent(filename);
            } else if (legacyFilesRegex.test(filename)) {
              fileObject['url'] = 'http://files.parse.com/' + config.fileKey + '/' + encodeURIComponent(filename);
            } else {
              fileObject['url'] = this.adapter.getFileLocation(config, filename);
            }
          }
        }
      }
    }
  }, {
    key: "expectedAdapterType",
    value: function expectedAdapterType() {
      return _FilesAdapter.FilesAdapter;
    }
  }, {
    key: "handleFileStream",
    value: function handleFileStream(config, filename, req, res, contentType) {
      return this.adapter.handleFileStream(filename, req, res, contentType);
    }
  }, {
    key: "validateFilename",
    value: function validateFilename(filename) {
      if (typeof this.adapter.validateFilename === 'function') {
        return this.adapter.validateFilename(filename);
      }

      return (0, _FilesAdapter["default"])(filename);
    }
  }]);

  return FilesController;
}(_AdaptableController2["default"]);

exports.FilesController = FilesController;
var _default = FilesController;
exports["default"] = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9Db250cm9sbGVycy9GaWxlc0NvbnRyb2xsZXIuanMiXSwibmFtZXMiOlsibGVnYWN5RmlsZXNSZWdleCIsIlJlZ0V4cCIsIkZpbGVzQ29udHJvbGxlciIsImNvbmZpZyIsImZpbGVuYW1lIiwiYWRhcHRlciIsImdldEZpbGVEYXRhIiwiZGF0YSIsImNvbnRlbnRUeXBlIiwiZXh0bmFtZSIsInBhdGgiLCJoYXNFeHRlbnNpb24iLCJsZW5ndGgiLCJtaW1lIiwiZ2V0RXh0ZW5zaW9uIiwiZ2V0VHlwZSIsIm9wdGlvbnMiLCJwcmVzZXJ2ZUZpbGVOYW1lIiwibG9jYXRpb24iLCJnZXRGaWxlTG9jYXRpb24iLCJjcmVhdGVGaWxlIiwidGhlbiIsIlByb21pc2UiLCJyZXNvbHZlIiwidXJsIiwibmFtZSIsImRlbGV0ZUZpbGUiLCJvYmplY3QiLCJBcnJheSIsIm1hcCIsIm9iaiIsImV4cGFuZEZpbGVzSW5PYmplY3QiLCJrZXkiLCJmaWxlT2JqZWN0IiwiZmlsZUtleSIsInVuZGVmaW5lZCIsImluZGV4T2YiLCJlbmNvZGVVUklDb21wb25lbnQiLCJ0ZXN0IiwiRmlsZXNBZGFwdGVyIiwicmVxIiwicmVzIiwiaGFuZGxlRmlsZVN0cmVhbSIsInZhbGlkYXRlRmlsZW5hbWUiLCJBZGFwdGFibGVDb250cm9sbGVyIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUEsSUFBTUEsZ0JBQWdCLEdBQUcsSUFBSUMsTUFBSixDQUN2QixpRkFEdUIsQ0FBekI7O0lBSWFDLGU7Ozs7Ozs7Ozs7Ozs7Z0NBQ0NDLE0sRUFBUUMsUSxFQUFVO0FBQzVCLGFBQU8sS0FBS0MsT0FBTCxDQUFhQyxXQUFiLENBQXlCRixRQUF6QixDQUFQO0FBQ0Q7OzsrQkFFVUQsTSxFQUFRQyxRLEVBQVVHLEksRUFBTUMsVyxFQUFhO0FBQzlDLFVBQU1DLE9BQU8sR0FBR0MsaUJBQUtELE9BQUws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QSxHQUdBRyxrQkFBa0IsQ0FBQ2pDLFFBQUQsQ0FKcEI7QUFLRCxhQU5NLE1BTUE7QUFDTDZCLGNBQUFBLFVBQVUsQ0FBQyxLQUFELENBQVYsR0FBb0IsS0FBSzVCLE9BQUwsQ0FBYWMsZUFBYixDQUE2QmhCLE1BQTdCLEVBQXFDQyxRQUFyQyxDQUFwQjtBQUNEO0FBQ0Y7QUFDRjtBQUNGO0FBQ0Y7OzswQ0FFcUI7QUFDcEIsYUFBT21DLDBCQUFQO0FBQ0Q7OztxQ0FFZ0JwQyxNLEVBQVFDLFEsRUFBVW9DLEcsRUFBS0MsRyxFQUFLakMsVyxFQUFhO0FBQ3hELGFBQU8sS0FBS0gsT0FBTCxDQUFhcUMsZ0JBQWIsQ0FBOEJ0QyxRQUE5QixFQUF3Q29DLEdBQXhDLEVBQTZDQyxHQUE3QyxFQUFrRGpDLFdBQWxELENBQVA7QUFDRDs7O3FDQUVnQkosUSxFQUFVO0FBQ3pCLFVBQUksT0FBTyxLQUFLQyxPQUFMLENBQWFzQyxnQkFBcEIsS0FBeUMsVUFBN0MsRUFBeUQ7QUFDdkQsZUFBTyxLQUFLdEMsT0FBTCxDQUFhc0MsZ0JBQWIsQ0FBOEJ2QyxRQUE5QixDQUFQO0FBQ0Q7O0FBQ0QsYUFBTyw4QkFBaUJBLFFBQWpCLENBQVA7QUFDRDs7OztFQTVGa0N3QyxnQzs7O2VBK0Z0QjFDLGUiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBGaWxlc0NvbnRyb2xsZXIuanNcbmltcG9ydCB7IHJhbmRvbUhleFN0cmluZyB9IGZyb20gJy4uL2NyeXB0b1V0aWxzJztcbmltcG9ydCBBZGFwdGFibGVDb250cm9sbGVyIGZyb20gJy4vQWRhcHRhYmxlQ29udHJvbGxlcic7XG5pbXBvcnQgdmFsaWRhdGVGaWxlbmFtZSwgeyBGaWxlc0FkYXB0ZXIgfSBmcm9tICcuLi9BZGFwdGVycy9GaWxlcy9GaWxlc0FkYXB0ZXInO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgbWltZSBmcm9tICdtaW1lJztcblxuY29uc3QgbGVnYWN5RmlsZXNSZWdleCA9IG5ldyBSZWdFeHAoXG4gICdeWzAtOWEtZkEtRl17OH0tWzAtOWEtZkEtRl17NH0tWzAtOWEtZkEtRl17NH0tWzAtOWEtZkEtRl17NH0tWzAtOWEtZkEtRl17MTJ9LS4qJ1xuKTtcblxuZXhwb3J0IGNsYXNzIEZpbGVzQ29udHJvbGxlciBleHRlbmRzIEFkYXB0YWJsZUNvbnRyb2xsZXIge1xuICBnZXRGaWxlRGF0YShjb25maWcsIGZpbGVuYW1lKSB7XG4gICAgcmV0dXJuIHRoaXMuYWRhcHRlci5nZXRGaWxlRGF0YShmaWxlbmFtZSk7XG4gIH1cblxuICBjcmVhdGVGaWxlKGNvbmZpZywgZmlsZW5hbWUsIGRhdGEsIGNvbnRlbnRUeXBlKSB7XG4gICAgY29uc3QgZXh0bmFtZSA9IHBhdGguZXh0bmFtZShmaWxlbmFtZSk7XG5cbiAgICBjb25zdCBoYXNFeHRlbnNpb24gPSBleHRuYW1lLmxlbmd0aCA+IDA7XG5cbiAgICBpZiAoIWhhc0V4dGVuc2lvbiAmJiBjb250ZW50VHlwZSAmJiBtaW1lLmdldEV4dGVuc2lvbihjb250ZW50VHlwZSkpIHtcbiAgICAgIGZpbGVuYW1lID0gZmlsZW5hbWUgKyAnLicgKyBtaW1lLmdldEV4dGVuc2lvbihjb250ZW50VHlwZSk7XG4gICAgfSBlbHNlIGlmIChoYXNFeHRlbnNpb24gJiYgIWNvbnRlbnRUeXBlKSB7XG4gICAgICBjb250ZW50VHlwZSA9IG1pbWUuZ2V0VHlwZShmaWxlbmFtZSk7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLm9wdGlvbnMucHJlc2VydmVGaWxlTmFtZSkge1xuICAgICAgZmlsZW5hbWUgPSByYW5kb21IZXhTdHJpbmcoMzIpICsgJ18nICsgZmlsZW5hbWU7XG4gICAgfVxuXG4gICAgY29uc3QgbG9jYXRpb24gPSB0aGlzLmFkYXB0ZXIuZ2V0RmlsZUxvY2F0aW9uKGNvbmZpZywgZmlsZW5hbWUpO1xuICAgIHJldHVybiB0aGlzLmFkYXB0ZXIuY3JlYXRlRmlsZShmaWxlbmFtZSwgZGF0YSwgY29udGVudFR5cGUpLnRoZW4oKCkgPT4ge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XG4gICAgICAgIHVybDogbG9jYXRpb24sXG4gICAgICAgIG5hbWU6IGZpbGVuYW1lLFxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBkZWxldGVGaWxlKGNvbmZpZywgZmlsZW5hbWUpIHtcbiAgICByZXR1cm4gdGhpcy5hZGFwdGVyLmRlbGV0ZUZpbGUoZmlsZW5hbWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZpbmQgZmlsZSByZWZlcmVuY2VzIGluIFJFU1QtZm9ybWF0IG9iamVjdCBhbmQgYWRkcyB0aGUgdXJsIGtleVxuICAgKiB3aXRoIHRoZSBjdXJyZW50IG1vdW50IHBvaW50IGFuZCBhcHAgaWQuXG4gICAqIE9iamVjdCBtYXkgYmUgYSBzaW5nbGUgb2JqZWN0IG9yIGxpc3Qgb2YgUkVTVC1mb3JtYXQgb2JqZWN0cy5cbiAgICovXG4gIGV4cGFuZEZpbGVzSW5PYmplY3QoY29uZmlnLCBvYmplY3QpIHtcbiAgICBpZiAob2JqZWN0IGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgIG9iamVjdC5tYXAob2JqID0+IHRoaXMuZXhwYW5kRmlsZXNJbk9iamVjdChjb25maWcsIG9iaikpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIG9iamVjdCAhPT0gJ29iamVjdCcpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZm9yIChjb25zdCBrZXkgaW4gb2JqZWN0KSB7XG4gICAgICBjb25zdCBmaWxlT2JqZWN0ID0gb2JqZWN0W2tleV07XG4gICAgICBpZiAoZmlsZU9iamVjdCAmJiBmaWxlT2JqZWN0WydfX3R5cGUnXSA9PT0gJ0ZpbGUnKSB7XG4gICAgICAgIGlmIChmaWxlT2JqZWN0Wyd1cmwnXSkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGZpbGVuYW1lID0gZmlsZU9iamVjdFsnbmFtZSddO1xuICAgICAgICAvLyBhbGwgZmlsZW5hbWVzIHN0YXJ0aW5nIHdpdGggXCJ0ZnNzLVwiIHNob3VsZCBiZSBmcm9tIGZpbGVzLnBhcnNldGZzcy5jb21cbiAgICAgICAgLy8gYWxsIGZpbGVuYW1lcyBzdGFydGluZyB3aXRoIGEgXCItXCIgc2VwZXJhdGVkIFVVSUQgc2hvdWxkIGJlIGZyb20gZmlsZXMucGFyc2UuY29tXG4gICAgICAgIC8vIGFsbCBvdGhlciBmaWxlbmFtZXMgaGF2ZSBiZWVuIG1pZ3JhdGVkIG9yIGNyZWF0ZWQgZnJvbSBQYXJzZSBTZXJ2ZXJcbiAgICAgICAgaWYgKGNvbmZpZy5maWxlS2V5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBmaWxlT2JqZWN0Wyd1cmwnXSA9IHRoaXMuYWRhcHRlci5nZXRGaWxlTG9jYXRpb24oY29uZmlnLCBmaWxlbmFtZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKGZpbGVuYW1lLmluZGV4T2YoJ3Rmc3MtJykgPT09IDApIHtcbiAgICAgICAgICAgIGZpbGVPYmplY3RbJ3VybCddID1cbiAgICAgICAgICAgICAgJ2h0dHA6Ly9maWxlcy5wYXJzZXRmc3MuY29tLycgK1xuICAgICAgICAgICAgICBjb25maWcuZmlsZUtleSArXG4gICAgICAgICAgICAgICcvJyArXG4gICAgICAgICAgICAgIGVuY29kZVVSSUNvbXBvbmVudChmaWxlbmFtZSk7XG4gICAgICAgICAgfSBlbHNlIGlmIChsZWdhY3lGaWxlc1JlZ2V4LnRlc3QoZmlsZW5hbWUpKSB7XG4gICAgICAgICAgICBmaWxlT2JqZWN0Wyd1cmwnXSA9XG4gICAgICAgICAgICAgICdodHRwOi8vZmlsZXMucGFyc2UuY29tLycgK1xuICAgICAgICAgICAgICBjb25maWcuZmlsZUtleSArXG4gICAgICAgICAgICAgICcvJyArXG4gICAgICAgICAgICAgIGVuY29kZVVSSUNvbXBvbmVudChmaWxlbmFtZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZpbGVPYmplY3RbJ3VybCddID0gdGhpcy5hZGFwdGVyLmdldEZpbGVMb2NhdGlvbihjb25maWcsIGZpbGVuYW1lKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBleHBlY3RlZEFkYXB0ZXJUeXBlKCkge1xuICAgIHJldHVybiBGaWxlc0FkYXB0ZXI7XG4gIH1cblxuICBoYW5kbGVGaWxlU3RyZWFtKGNvbmZpZywgZmlsZW5hbWUsIHJlcSwgcmVzLCBjb250ZW50VHlwZSkge1xuICAgIHJldHVybiB0aGlzLmFkYXB0ZXIuaGFuZGxlRmlsZVN0cmVhbShmaWxlbmFtZSwgcmVxLCByZXMsIGNvbnRlbnRUeXBlKTtcbiAgfVxuXG4gIHZhbGlkYXRlRmlsZW5hbWUoZmlsZW5hbWUpIHtcbiAgICBpZiAodHlwZW9mIHRoaXMuYWRhcHRlci52YWxpZGF0ZUZpbGVuYW1lID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gdGhpcy5hZGFwdGVyLnZhbGlkYXRlRmlsZW5hbWUoZmlsZW5hbWUpO1xuICAgIH1cbiAgICByZXR1cm4gdmFsaWRhdGVGaWxlbmFtZShmaWxlbmFtZSk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgRmlsZXNDb250cm9sbGVyO1xuIl19