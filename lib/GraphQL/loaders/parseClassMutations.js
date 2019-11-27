"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.load = void 0;

var _graphql = require("graphql");

var _graphqlListFields = _interopRequireDefault(require("graphql-list-fields"));

var defaultGraphQLTypes = _interopRequireWildcard(require("./defaultGraphQLTypes"));

var _parseGraphQLUtils = require("../parseGraphQLUtils");

var objectsMutations = _interopRequireWildcard(require("../helpers/objectsMutations"));

var objectsQueries = _interopRequireWildcard(require("../helpers/objectsQueries"));

var _ParseGraphQLController = require("../../Controllers/ParseGraphQLController");

var _className = require("../transformers/className");

var _mutation = require("../transformers/mutation");

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const getOnlyRequiredFields = (updatedFields, selectedFieldsString, includedFieldsString, nativeObjectFields) => {
  const includedFields = includedFieldsString.split(',');
  const selectedFields = selectedFieldsString.split(',');
  const missingFields = selectedFields.filter(field => !nativeObjectFields.includes(field) || includedFields.includes(field)).join(',');

  if (!missingFields.length) {
    return {
      needGet: false,
      keys: ''
    };
  } else {
    return {
      needGet: true,
      keys: missingFields
    };
  }
};

const load = function (parseGraphQLSchema, parseClass, parseClassConfig) {
  const className = parseClass.className;
  const graphQLClassName = (0, _className.transformClassNameToGraphQL)(className);
  const {
    create: isCreateEnabled = true,
    update: isUpdateEnabled = true,
    destroy: isDestroyEnabled = true
  } = (0, _parseGraphQLUtils.getParseClassMutationConfig)(parseClassConfig);
  const {
    classGraphQLCreateType,
    classGraphQLUpdateType,
    classGraphQLOutputType
  } = parseGraphQLSchema.parseClassTypes[className];

  if (isCreateEnabled) {
    const createGraphQLMutationName = `create${graphQLClassName}`;
    parseGraphQLSchema.addGraphQLMutation(createGraphQLMutationName, {
      description: `The ${createGraphQLMutationName} mutation can be used to create a new object of the ${graphQLClassName} class.`,
      args: {
        fields: {
          description: 'These are the fields used to create the object.',
          type: classGraphQLCreateType || defaultGraphQLTypes.OBJECT
        }
      },
      type: new _graphql.GraphQLNonNull(classGraphQLOutputType || defaultGraphQLTypes.OBJECT),

      async resolve(_source, args, context, mutationInfo) {
        try {
          let {
            fields
          } = args;
          if (!fields) fields = {};
          const {
            config,
            auth,
            info
          } = context;
          const parseFields = await (0, _mutation.transformTypes)('create', fields, {
            className,
            parseGraphQLSchema,
            req: {
              config,
              auth,
              info
            }
          });
          const createdObject = await objectsMutations.createObject(className, parseFields, config, auth, info);
          const selectedFields = (0, _graphqlListFields.default)(mutationInfo);
          const {
            keys,
            include
          } = (0, _parseGraphQLUtils.extractKeysAndInclude)(selectedFields);
          const {
            keys: requiredKeys,
            needGet
          } = getOnlyRequiredFields(fields, keys, include, ['id', 'createdAt', 'updatedAt']);
          let optimizedObject = {};

          if (needGet) {
            optimizedObject = await objectsQueries.getObject(className, createdObject.objectId, requiredKeys, include, undefined, undefined, config, auth, info);
          }

          return _objectSpread({}, createdObject, {
            updatedAt: createdObject.createdAt
          }, parseFields, {}, optimizedObject);
        } catch (e) {
          parseGraphQLSchema.handleError(e);
        }
      }

    });
  }

  if (isUpdateEnabled) {
    const updateGraphQLMutationName = `update${graphQLClassName}`;
    parseGraphQLSchema.addGraphQLMutation(updateGraphQLMutationName, {
      description: `The ${updateGraphQLMutationName} mutation can be used to update an object of the ${graphQLClassName} class.`,
      args: {
        id: defaultGraphQLTypes.OBJECT_ID_ATT,
        fields: {
          description: 'These are the fields used to update the object.',
          type: classGraphQLUpdateType || defaultGraphQLTypes.OBJECT
        }
      },
      type: new _graphql.GraphQLNonNull(classGraphQLOutputType || defaultGraphQLTypes.OBJECT),

      async resolve(_source, args, context, mutationInfo) {
        try {
          const {
            id,
            fields
          } = args;
          const {
            config,
            auth,
            info
          } = context;
          const parseFields = await (0, _mutation.transformTypes)('update', fields, {
            className,
            parseGraphQLSchema,
            req: {
              config,
              auth,
              info
            }
          });
          const updatedObject = await objectsMutations.updateObject(className, id, parseFields, config, auth, info);
          const selectedFields = (0, _graphqlListFields.default)(mutationInfo);
          const {
            keys,
            include
          } = (0, _parseGraphQLUtils.extractKeysAndInclude)(selectedFields);
          const {
            keys: requiredKeys,
            needGet
          } = getOnlyRequiredFields(fields, keys, include, ['id', 'updatedAt']);
          let optimizedObject = {};

          if (needGet) {
            optimizedObject = await objectsQueries.getObject(className, id, requiredKeys, include, undefined, undefined, config, auth, info);
          }

          return _objectSpread({
            id
          }, updatedObject, {}, parseFields, {}, optimizedObject);
        } catch (e) {
          parseGraphQLSchema.handleError(e);
        }
      }

    });
  }

  if (isDestroyEnabled) {
    const deleteGraphQLMutationName = `delete${graphQLClassName}`;
    parseGraphQLSchema.addGraphQLMutation(deleteGraphQLMutationName, {
      description: `The ${deleteGraphQLMutationName} mutation can be used to delete an object of the ${graphQLClassName} class.`,
      args: {
        id: defaultGraphQLTypes.OBJECT_ID_ATT
      },
      type: new _graphql.GraphQLNonNull(classGraphQLOutputType || defaultGraphQLTypes.OBJECT),

      async resolve(_source, args, context, mutationInfo) {
        try {
          const {
            id
          } = args;
          const {
            config,
            auth,
            info
          } = context;
          const selectedFields = (0, _graphqlListFields.default)(mutationInfo);
          const {
            keys,
            include
          } = (0, _parseGraphQLUtils.extractKeysAndInclude)(selectedFields);
          let optimizedObject = {};
          const splitedKeys = keys.split(',');

          if (splitedKeys.length > 1 || splitedKeys[0] !== 'id') {
            optimizedObject = await objectsQueries.getObject(className, id, keys, include, undefined, undefined, config, auth, info);
          }

          await objectsMutations.deleteObject(className, id, config, auth, info);
          return _objectSpread({
            id
          }, optimizedObject);
        } catch (e) {
          parseGraphQLSchema.handleError(e);
        }
      }

    });
  }
};

exports.load = load;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9HcmFwaFFML2xvYWRlcnMvcGFyc2VDbGFzc011dGF0aW9ucy5qcyJdLCJuYW1lcyI6WyJnZXRPbmx5UmVxdWlyZWRGaWVsZHMiLCJ1cGRhdGVkRmllbGRzIiwic2VsZWN0ZWRGaWVsZHNTdHJpbmciLCJpbmNsdWRlZEZpZWxkc1N0cmluZyIsIm5hdGl2ZU9iamVjdEZpZWxkcyIsImluY2x1ZGVkRmllbGRzIiwic3BsaXQiLCJzZWxlY3RlZEZpZWxkcyIsIm1pc3NpbmdGaWVsZHMiLCJmaWx0ZXIiLCJmaWVsZCIsImluY2x1ZGVzIiwiam9pbiIsImxlbmd0aCIsIm5lZWRHZXQiLCJrZXlzIiwibG9hZCIsInBhcnNlR3JhcGhRTFNjaGVtYSIsInBhcnNlQ2xhc3MiLCJwYXJzZUNsYXNzQ29uZmlnIiwiY2xhc3NOYW1lIiwiZ3JhcGhRTENsYXNzTmFtZSIsImNyZWF0ZSIsImlzQ3JlYXRlRW5hYmxlZCIsInVwZGF0ZSIsImlzVXBkYXRlRW5hYmxlZCIsImRlc3Ryb3kiLCJpc0Rlc3Ryb3lFbmFibGVkIiwiY2xhc3NHcmFwaFFMQ3JlYXRlVHlwZSIsImNsYXNzR3JhcGhRTFVwZGF0ZVR5cGUiLCJjbGFzc0dyYXBoUUxPdXRwdXRUeXBlIiwicGFyc2VDbGFzc1R5cGVzIiwiY3JlYXRlR3JhcGhRTE11dGF0aW9uTmFtZSIsImFkZEdyYXBoUUxNdXRhdGlvbiIsImRlc2NyaXB0aW9uIiwiYXJncyIsImZpZWxkcyIsInR5cGUiLCJkZWZhdWx0R3JhcGhRTFR5cGVzIiwiT0JKRUNUIiwiR3JhcGhRTE5vbk51bGwiLCJyZXNvbHZlIiwiX3NvdXJjZSIsImNvbnRleHQiLCJtdXRhdGlvbkluZm8iLCJjb25maWciLCJhdXRoIiwiaW5mbyIsInBhcnNlRmllbGRzIiwicmVxIiwiY3JlYXRlZE9iamVjdCIsIm9iamVjdHNNdXRhdGlvbnMiLCJjcmVhdGVPYmplY3QiLCJpbmNsdWRlIiwicmVxdWlyZWRLZXlzIiwib3B0aW1pemVkT2JqZWN0Iiwib2JqZWN0c1F1ZXJpZXMiLCJnZXRPYmplY3QiLCJvYmplY3RJZCIsInVuZGVmaW5lZCIsInVwZGF0ZWRBdCIsImNyZWF0ZWRBdCIsImUiLCJoYW5kbGVFcnJvciIsInVwZGF0ZUdyYXBoUUxNdXRhdGlvbk5hbWUiLCJpZCIsIk9CSkVDVF9JRF9BVFQiLCJ1cGRhdGVkT2JqZWN0IiwidXBkYXRlT2JqZWN0IiwiZGVsZXRlR3JhcGhRTE11dGF0aW9uTmFtZSIsInNwbGl0ZWRLZXlzIiwiZGVsZXRlT2JqZWN0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBSUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7Ozs7Ozs7Ozs7O0FBRUEsTUFBTUEscUJBQXFCLEdBQUcsQ0FDNUJDLGFBRDRCLEVBRTVCQyxvQkFGNEIsRUFHNUJDLG9CQUg0QixFQUk1QkMsa0JBSjRCLEtBS3pCO0FBQ0gsUUFBTUMsY0FBYyxHQUFHRixvQkFBb0IsQ0FBQ0csS0FBckIsQ0FBMkIsR0FBM0IsQ0FBdkI7QUFDQSxRQUFNQyxjQUFjLEdBQUdMLG9CQUFvQixDQUFDSSxLQUFyQixDQUEyQixHQUEzQixDQUF2QjtBQUNBLFFBQU1FLGFBQWEsR0FBR0QsY0FBYyxDQUNqQ0UsTUFEbUIsQ0FFbEJDLEtBQUssSUFDSCxDQUFDTixrQkFBa0IsQ0FBQ08sUUFBbkIsQ0FBNEJELEtBQTVCLENBQUQsSUFDQUwsY0FBYyxDQUFDTSxRQUFmLENBQXdCRCxLQUF4QixDQUpnQixFQU1uQkUsSUFObUIsQ0FNZCxHQU5jLENBQXRCOztBQU9BLE1BQUksQ0FBQ0osYUFBYSxDQUFDSyxNQUFuQixFQUEyQjtBQUN6QixXQUFPO0FBQUVDLE1BQUFBLE9BQU8sRUFBRSxLQUFYO0FBQWtCQyxNQUFBQSxJQUFJLEVBQUU7QUFBeEIsS0FBUDtBQUNELEdBRkQsTUFFTztBQUNMLFdBQU87QUFBRUQsTUFBQUEsT0FBTyxFQUFFLElBQVg7QUFBaUJDLE1BQUFBLElBQUksRUFBRVA7QUFBdkIsS0FBUDtBQUNEO0FBQ0YsQ0FwQkQ7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ckIsSUFBMEJ5RCxXQUFXLENBQUMsQ0FBRCxDQUFYLEtBQW1CLElBQWpELEVBQXVEO0FBQ3JEZixZQUFBQSxlQUFlLEdBQUcsTUFBTUMsY0FBYyxDQUFDQyxTQUFmLENBQ3RCckMsU0FEc0IsRUFFdEI2QyxFQUZzQixFQUd0QmxELElBSHNCLEVBSXRCc0MsT0FKc0IsRUFLdEJNLFNBTHNCLEVBTXRCQSxTQU5zQixFQU90QmQsTUFQc0IsRUFRdEJDLElBUnNCLEVBU3RCQyxJQVRzQixDQUF4QjtBQVdEOztBQUNELGdCQUFNSSxnQkFBZ0IsQ0FBQ29CLFlBQWpCLENBQ0puRCxTQURJLEVBRUo2QyxFQUZJLEVBR0pwQixNQUhJLEVBSUpDLElBSkksRUFLSkMsSUFMSSxDQUFOO0FBT0E7QUFBU2tCLFlBQUFBO0FBQVQsYUFBZ0JWLGVBQWhCO0FBQ0QsU0E3QkQsQ0E2QkUsT0FBT08sQ0FBUCxFQUFVO0FBQ1Y3QyxVQUFBQSxrQkFBa0IsQ0FBQzhDLFdBQW5CLENBQStCRCxDQUEvQjtBQUNEO0FBQ0Y7O0FBekM4RCxLQUFqRTtBQTJDRDtBQUNGLENBM01EIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgR3JhcGhRTE5vbk51bGwgfSBmcm9tICdncmFwaHFsJztcbmltcG9ydCBnZXRGaWVsZE5hbWVzIGZyb20gJ2dyYXBocWwtbGlzdC1maWVsZHMnO1xuaW1wb3J0ICogYXMgZGVmYXVsdEdyYXBoUUxUeXBlcyBmcm9tICcuL2RlZmF1bHRHcmFwaFFMVHlwZXMnO1xuaW1wb3J0IHtcbiAgZXh0cmFjdEtleXNBbmRJbmNsdWRlLFxuICBnZXRQYXJzZUNsYXNzTXV0YXRpb25Db25maWcsXG59IGZyb20gJy4uL3BhcnNlR3JhcGhRTFV0aWxzJztcbmltcG9ydCAqIGFzIG9iamVjdHNNdXRhdGlvbnMgZnJvbSAnLi4vaGVscGVycy9vYmplY3RzTXV0YXRpb25zJztcbmltcG9ydCAqIGFzIG9iamVjdHNRdWVyaWVzIGZyb20gJy4uL2hlbHBlcnMvb2JqZWN0c1F1ZXJpZXMnO1xuaW1wb3J0IHsgUGFyc2VHcmFwaFFMQ2xhc3NDb25maWcgfSBmcm9tICcuLi8uLi9Db250cm9sbGVycy9QYXJzZUdyYXBoUUxDb250cm9sbGVyJztcbmltcG9ydCB7IHRyYW5zZm9ybUNsYXNzTmFtZVRvR3JhcGhRTCB9IGZyb20gJy4uL3RyYW5zZm9ybWVycy9jbGFzc05hbWUnO1xuaW1wb3J0IHsgdHJhbnNmb3JtVHlwZXMgfSBmcm9tICcuLi90cmFuc2Zvcm1lcnMvbXV0YXRpb24nO1xuXG5jb25zdCBnZXRPbmx5UmVxdWlyZWRGaWVsZHMgPSAoXG4gIHVwZGF0ZWRGaWVsZHMsXG4gIHNlbGVjdGVkRmllbGRzU3RyaW5nLFxuICBpbmNsdWRlZEZpZWxkc1N0cmluZyxcbiAgbmF0aXZlT2JqZWN0RmllbGRzXG4pID0+IHtcbiAgY29uc3QgaW5jbHVkZWRGaWVsZHMgPSBpbmNsdWRlZEZpZWxkc1N0cmluZy5zcGxpdCgnLCcpO1xuICBjb25zdCBzZWxlY3RlZEZpZWxkcyA9IHNlbGVjdGVkRmllbGRzU3RyaW5nLnNwbGl0KCcsJyk7XG4gIGNvbnN0IG1pc3NpbmdGaWVsZHMgPSBzZWxlY3RlZEZpZWxkc1xuICAgIC5maWx0ZXIoXG4gICAgICBmaWVsZCA9PlxuICAgICAgICAhbmF0aXZlT2JqZWN0RmllbGRzLmluY2x1ZGVzKGZpZWxkKSB8fFxuICAgICAgICBpbmNsdWRlZEZpZWxkcy5pbmNsdWRlcyhmaWVsZClcbiAgICApXG4gICAgLmpvaW4oJywnKTtcbiAgaWYgKCFtaXNzaW5nRmllbGRzLmxlbmd0aCkge1xuICAgIHJldHVybiB7IG5lZWRHZXQ6IGZhbHNlLCBrZXlzOiAnJyB9O1xuICB9IGVsc2Uge1xuICAgIHJldHVybiB7IG5lZWRHZXQ6IHRydWUsIGtleXM6IG1pc3NpbmdGaWVsZHMgfTtcbiAgfVxufTtcblxuY29uc3QgbG9hZCA9IGZ1bmN0aW9uKFxuICBwYXJzZUdyYXBoUUxTY2hlbWEsXG4gIHBhcnNlQ2xhc3MsXG4gIHBhcnNlQ2xhc3NDb25maWc6ID9QYXJzZUdyYXBoUUxDbGFzc0NvbmZpZ1xuKSB7XG4gIGNvbnN0IGNsYXNzTmFtZSA9IHBhcnNlQ2xhc3MuY2xhc3NOYW1lO1xuICBjb25zdCBncmFwaFFMQ2xhc3NOYW1lID0gdHJhbnNmb3JtQ2xhc3NOYW1lVG9HcmFwaFFMKGNsYXNzTmFtZSk7XG5cbiAgY29uc3Qge1xuICAgIGNyZWF0ZTogaXNDcmVhdGVFbmFibGVkID0gdHJ1ZSxcbiAgICB1cGRhdGU6IGlzVXBkYXRlRW5hYmxlZCA9IHRydWUsXG4gICAgZGVzdHJveTogaXNEZXN0cm95RW5hYmxlZCA9IHRydWUsXG4gIH0gPSBnZXRQYXJzZUNsYXNzTXV0YXRpb25Db25maWcocGFyc2VDbGFzc0NvbmZpZyk7XG5cbiAgY29uc3Qge1xuICAgIGNsYXNzR3JhcGhRTENyZWF0ZVR5cGUsXG4gICAgY2xhc3NHcmFwaFFMVXBkYXRlVHlwZSxcbiAgICBjbGFzc0dyYXBoUUxPdXRwdXRUeXBlLFxuICB9ID0gcGFyc2VHcmFwaFFMU2NoZW1hLnBhcnNlQ2xhc3NUeXBlc1tjbGFzc05hbWVdO1xuXG4gIGlmIChpc0NyZWF0ZUVuYWJsZWQpIHtcbiAgICBjb25zdCBjcmVhdGVHcmFwaFFMTXV0YXRpb25OYW1lID0gYGNyZWF0ZSR7Z3JhcGhRTENsYXNzTmFtZX1gO1xuICAgIHBhcnNlR3JhcGhRTFNjaGVtYS5hZGRHcmFwaFFMTXV0YXRpb24oY3JlYXRlR3JhcGhRTE11dGF0aW9uTmFtZSwge1xuICAgICAgZGVzY3JpcHRpb246IGBUaGUgJHtjcmVhdGVHcmFwaFFMTXV0YXRpb25OYW1lfSBtdXRhdGlvbiBjYW4gYmUgdXNlZCB0byBjcmVhdGUgYSBuZXcgb2JqZWN0IG9mIHRoZSAke2dyYXBoUUxDbGFzc05hbWV9IGNsYXNzLmAsXG4gICAgICBhcmdzOiB7XG4gICAgICAgIGZpZWxkczoge1xuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVGhlc2UgYXJlIHRoZSBmaWVsZHMgdXNlZCB0byBjcmVhdGUgdGhlIG9iamVjdC4nLFxuICAgICAgICAgIHR5cGU6IGNsYXNzR3JhcGhRTENyZWF0ZVR5cGUgfHwgZGVmYXVsdEdyYXBoUUxUeXBlcy5PQkpFQ1QsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgdHlwZTogbmV3IEdyYXBoUUxOb25OdWxsKFxuICAgICAgICBjbGFzc0dyYXBoUUxPdXRwdXRUeXBlIHx8IGRlZmF1bHRHcmFwaFFMVHlwZXMuT0JKRUNUXG4gICAgICApLFxuICAgICAgYXN5bmMgcmVzb2x2ZShfc291cmNlLCBhcmdzLCBjb250ZXh0LCBtdXRhdGlvbkluZm8pIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBsZXQgeyBmaWVsZHMgfSA9IGFyZ3M7XG4gICAgICAgICAgaWYgKCFmaWVsZHMpIGZpZWxkcyA9IHt9O1xuICAgICAgICAgIGNvbnN0IHsgY29uZmlnLCBhdXRoLCBpbmZvIH0gPSBjb250ZXh0O1xuXG4gICAgICAgICAgY29uc3QgcGFyc2VGaWVsZHMgPSBhd2FpdCB0cmFuc2Zvcm1UeXBlcygnY3JlYXRlJywgZmllbGRzLCB7XG4gICAgICAgICAgICBjbGFzc05hbWUsXG4gICAgICAgICAgICBwYXJzZUdyYXBoUUxTY2hlbWEsXG4gICAgICAgICAgICByZXE6IHsgY29uZmlnLCBhdXRoLCBpbmZvIH0sXG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBjb25zdCBjcmVhdGVkT2JqZWN0ID0gYXdhaXQgb2JqZWN0c011dGF0aW9ucy5jcmVhdGVPYmplY3QoXG4gICAgICAgICAgICBjbGFzc05hbWUsXG4gICAgICAgICAgICBwYXJzZUZpZWxkcyxcbiAgICAgICAgICAgIGNvbmZpZyxcbiAgICAgICAgICAgIGF1dGgsXG4gICAgICAgICAgICBpbmZvXG4gICAgICAgICAgKTtcbiAgICAgICAgICBjb25zdCBzZWxlY3RlZEZpZWxkcyA9IGdldEZpZWxkTmFtZXMobXV0YXRpb25JbmZvKTtcbiAgICAgICAgICBjb25zdCB7IGtleXMsIGluY2x1ZGUgfSA9IGV4dHJhY3RLZXlzQW5kSW5jbHVkZShzZWxlY3RlZEZpZWxkcyk7XG4gICAgICAgICAgY29uc3QgeyBrZXlzOiByZXF1aXJlZEtleXMsIG5lZWRHZXQgfSA9IGdldE9ubHlSZXF1aXJlZEZpZWxkcyhcbiAgICAgICAgICAgIGZpZWxkcyxcbiAgICAgICAgICAgIGtleXMsXG4gICAgICAgICAgICBpbmNsdWRlLFxuICAgICAgICAgICAgWydpZCcsICdjcmVhdGVkQXQnLCAndXBkYXRlZEF0J11cbiAgICAgICAgICApO1xuICAgICAgICAgIGxldCBvcHRpbWl6ZWRPYmplY3QgPSB7fTtcbiAgICAgICAgICBpZiAobmVlZEdldCkge1xuICAgICAgICAgICAgb3B0aW1pemVkT2JqZWN0ID0gYXdhaXQgb2JqZWN0c1F1ZXJpZXMuZ2V0T2JqZWN0KFxuICAgICAgICAgICAgICBjbGFzc05hbWUsXG4gICAgICAgICAgICAgIGNyZWF0ZWRPYmplY3Qub2JqZWN0SWQsXG4gICAgICAgICAgICAgIHJlcXVpcmVkS2V5cyxcbiAgICAgICAgICAgICAgaW5jbHVkZSxcbiAgICAgICAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgICAgICAgIGNvbmZpZyxcbiAgICAgICAgICAgICAgYXV0aCxcbiAgICAgICAgICAgICAgaW5mb1xuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC4uLmNyZWF0ZWRPYmplY3QsXG4gICAgICAgICAgICB1cGRhdGVkQXQ6IGNyZWF0ZWRPYmplY3QuY3JlYXRlZEF0LFxuICAgICAgICAgICAgLi4ucGFyc2VGaWVsZHMsXG4gICAgICAgICAgICAuLi5vcHRpbWl6ZWRPYmplY3QsXG4gICAgICAgICAgfTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIHBhcnNlR3JhcGhRTFNjaGVtYS5oYW5kbGVFcnJvcihlKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9KTtcbiAgfVxuXG4gIGlmIChpc1VwZGF0ZUVuYWJsZWQpIHtcbiAgICBjb25zdCB1cGRhdGVHcmFwaFFMTXV0YXRpb25OYW1lID0gYHVwZGF0ZSR7Z3JhcGhRTENsYXNzTmFtZX1gO1xuICAgIHBhcnNlR3JhcGhRTFNjaGVtYS5hZGRHcmFwaFFMTXV0YXRpb24odXBkYXRlR3JhcGhRTE11dGF0aW9uTmFtZSwge1xuICAgICAgZGVzY3JpcHRpb246IGBUaGUgJHt1cGRhdGVHcmFwaFFMTXV0YXRpb25OYW1lfSBtdXRhdGlvbiBjYW4gYmUgdXNlZCB0byB1cGRhdGUgYW4gb2JqZWN0IG9mIHRoZSAke2dyYXBoUUxDbGFzc05hbWV9IGNsYXNzLmAsXG4gICAgICBhcmdzOiB7XG4gICAgICAgIGlkOiBkZWZhdWx0R3JhcGhRTFR5cGVzLk9CSkVDVF9JRF9BVFQsXG4gICAgICAgIGZpZWxkczoge1xuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVGhlc2UgYXJlIHRoZSBmaWVsZHMgdXNlZCB0byB1cGRhdGUgdGhlIG9iamVjdC4nLFxuICAgICAgICAgIHR5cGU6IGNsYXNzR3JhcGhRTFVwZGF0ZVR5cGUgfHwgZGVmYXVsdEdyYXBoUUxUeXBlcy5PQkpFQ1QsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgdHlwZTogbmV3IEdyYXBoUUxOb25OdWxsKFxuICAgICAgICBjbGFzc0dyYXBoUUxPdXRwdXRUeXBlIHx8IGRlZmF1bHRHcmFwaFFMVHlwZXMuT0JKRUNUXG4gICAgICApLFxuICAgICAgYXN5bmMgcmVzb2x2ZShfc291cmNlLCBhcmdzLCBjb250ZXh0LCBtdXRhdGlvbkluZm8pIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCB7IGlkLCBmaWVsZHMgfSA9IGFyZ3M7XG4gICAgICAgICAgY29uc3QgeyBjb25maWcsIGF1dGgsIGluZm8gfSA9IGNvbnRleHQ7XG5cbiAgICAgICAgICBjb25zdCBwYXJzZUZpZWxkcyA9IGF3YWl0IHRyYW5zZm9ybVR5cGVzKCd1cGRhdGUnLCBmaWVsZHMsIHtcbiAgICAgICAgICAgIGNsYXNzTmFtZSxcbiAgICAgICAgICAgIHBhcnNlR3JhcGhRTFNjaGVtYSxcbiAgICAgICAgICAgIHJlcTogeyBjb25maWcsIGF1dGgsIGluZm8gfSxcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGNvbnN0IHVwZGF0ZWRPYmplY3QgPSBhd2FpdCBvYmplY3RzTXV0YXRpb25zLnVwZGF0ZU9iamVjdChcbiAgICAgICAgICAgIGNsYXNzTmFtZSxcbiAgICAgICAgICAgIGlkLFxuICAgICAgICAgICAgcGFyc2VGaWVsZHMsXG4gICAgICAgICAgICBjb25maWcsXG4gICAgICAgICAgICBhdXRoLFxuICAgICAgICAgICAgaW5mb1xuICAgICAgICAgICk7XG5cbiAgICAgICAgICBjb25zdCBzZWxlY3RlZEZpZWxkcyA9IGdldEZpZWxkTmFtZXMobXV0YXRpb25JbmZvKTtcbiAgICAgICAgICBjb25zdCB7IGtleXMsIGluY2x1ZGUgfSA9IGV4dHJhY3RLZXlzQW5kSW5jbHVkZShzZWxlY3RlZEZpZWxkcyk7XG5cbiAgICAgICAgICBjb25zdCB7IGtleXM6IHJlcXVpcmVkS2V5cywgbmVlZEdldCB9ID0gZ2V0T25seVJlcXVpcmVkRmllbGRzKFxuICAgICAgICAgICAgZmllbGRzLFxuICAgICAgICAgICAga2V5cyxcbiAgICAgICAgICAgIGluY2x1ZGUsXG4gICAgICAgICAgICBbJ2lkJywgJ3VwZGF0ZWRBdCddXG4gICAgICAgICAgKTtcbiAgICAgICAgICBsZXQgb3B0aW1pemVkT2JqZWN0ID0ge307XG4gICAgICAgICAgaWYgKG5lZWRHZXQpIHtcbiAgICAgICAgICAgIG9wdGltaXplZE9iamVjdCA9IGF3YWl0IG9iamVjdHNRdWVyaWVzLmdldE9iamVjdChcbiAgICAgICAgICAgICAgY2xhc3NOYW1lLFxuICAgICAgICAgICAgICBpZCxcbiAgICAgICAgICAgICAgcmVxdWlyZWRLZXlzLFxuICAgICAgICAgICAgICBpbmNsdWRlLFxuICAgICAgICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgICAgICAgIHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgY29uZmlnLFxuICAgICAgICAgICAgICBhdXRoLFxuICAgICAgICAgICAgICBpbmZvXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgaWQsXG4gICAgICAgICAgICAuLi51cGRhdGVkT2JqZWN0LFxuICAgICAgICAgICAgLi4ucGFyc2VGaWVsZHMsXG4gICAgICAgICAgICAuLi5vcHRpbWl6ZWRPYmplY3QsXG4gICAgICAgICAgfTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIHBhcnNlR3JhcGhRTFNjaGVtYS5oYW5kbGVFcnJvcihlKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9KTtcbiAgfVxuXG4gIGlmIChpc0Rlc3Ryb3lFbmFibGVkKSB7XG4gICAgY29uc3QgZGVsZXRlR3JhcGhRTE11dGF0aW9uTmFtZSA9IGBkZWxldGUke2dyYXBoUUxDbGFzc05hbWV9YDtcbiAgICBwYXJzZUdyYXBoUUxTY2hlbWEuYWRkR3JhcGhRTE11dGF0aW9uKGRlbGV0ZUdyYXBoUUxNdXRhdGlvbk5hbWUsIHtcbiAgICAgIGRlc2NyaXB0aW9uOiBgVGhlICR7ZGVsZXRlR3JhcGhRTE11dGF0aW9uTmFtZX0gbXV0YXRpb24gY2FuIGJlIHVzZWQgdG8gZGVsZXRlIGFuIG9iamVjdCBvZiB0aGUgJHtncmFwaFFMQ2xhc3NOYW1lfSBjbGFzcy5gLFxuICAgICAgYXJnczoge1xuICAgICAgICBpZDogZGVmYXVsdEdyYXBoUUxUeXBlcy5PQkpFQ1RfSURfQVRULFxuICAgICAgfSxcbiAgICAgIHR5cGU6IG5ldyBHcmFwaFFMTm9uTnVsbChcbiAgICAgICAgY2xhc3NHcmFwaFFMT3V0cHV0VHlwZSB8fCBkZWZhdWx0R3JhcGhRTFR5cGVzLk9CSkVDVFxuICAgICAgKSxcbiAgICAgIGFzeW5jIHJlc29sdmUoX3NvdXJjZSwgYXJncywgY29udGV4dCwgbXV0YXRpb25JbmZvKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgeyBpZCB9ID0gYXJncztcbiAgICAgICAgICBjb25zdCB7IGNvbmZpZywgYXV0aCwgaW5mbyB9ID0gY29udGV4dDtcbiAgICAgICAgICBjb25zdCBzZWxlY3RlZEZpZWxkcyA9IGdldEZpZWxkTmFtZXMobXV0YXRpb25JbmZvKTtcbiAgICAgICAgICBjb25zdCB7IGtleXMsIGluY2x1ZGUgfSA9IGV4dHJhY3RLZXlzQW5kSW5jbHVkZShzZWxlY3RlZEZpZWxkcyk7XG5cbiAgICAgICAgICBsZXQgb3B0aW1pemVkT2JqZWN0ID0ge307XG4gICAgICAgICAgY29uc3Qgc3BsaXRlZEtleXMgPSBrZXlzLnNwbGl0KCcsJyk7XG4gICAgICAgICAgaWYgKHNwbGl0ZWRLZXlzLmxlbmd0aCA+IDEgfHwgc3BsaXRlZEtleXNbMF0gIT09ICdpZCcpIHtcbiAgICAgICAgICAgIG9wdGltaXplZE9iamVjdCA9IGF3YWl0IG9iamVjdHNRdWVyaWVzLmdldE9iamVjdChcbiAgICAgICAgICAgICAgY2xhc3NOYW1lLFxuICAgICAgICAgICAgICBpZCxcbiAgICAgICAgICAgICAga2V5cyxcbiAgICAgICAgICAgICAgaW5jbHVkZSxcbiAgICAgICAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgICAgICAgIGNvbmZpZyxcbiAgICAgICAgICAgICAgYXV0aCxcbiAgICAgICAgICAgICAgaW5mb1xuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYXdhaXQgb2JqZWN0c011dGF0aW9ucy5kZWxldGVPYmplY3QoXG4gICAgICAgICAgICBjbGFzc05hbWUsXG4gICAgICAgICAgICBpZCxcbiAgICAgICAgICAgIGNvbmZpZyxcbiAgICAgICAgICAgIGF1dGgsXG4gICAgICAgICAgICBpbmZvXG4gICAgICAgICAgKTtcbiAgICAgICAgICByZXR1cm4geyBpZCwgLi4ub3B0aW1pemVkT2JqZWN0IH07XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICBwYXJzZUdyYXBoUUxTY2hlbWEuaGFuZGxlRXJyb3IoZSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cbn07XG5cbmV4cG9ydCB7IGxvYWQgfTtcbiJdfQ==