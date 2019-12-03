"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.transformTypes = void 0;

var defaultGraphQLTypes = _interopRequireWildcard(require("../loaders/defaultGraphQLTypes"));

var objectsMutations = _interopRequireWildcard(require("../helpers/objectsMutations"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const transformTypes = async (inputType, fields, {
  className,
  parseGraphQLSchema,
  req
}) => {
  const {
    classGraphQLCreateType,
    classGraphQLUpdateType,
    config: {
      isCreateEnabled,
      isUpdateEnabled
    }
  } = parseGraphQLSchema.parseClassTypes[className];
  const parseClass = parseGraphQLSchema.parseClasses.find(clazz => clazz.className === className);

  if (fields) {
    const classGraphQLCreateTypeFields = isCreateEnabled && classGraphQLCreateType ? classGraphQLCreateType.getFields() : null;
    const classGraphQLUpdateTypeFields = isUpdateEnabled && classGraphQLUpdateType ? classGraphQLUpdateType.getFields() : null;
    const promises = Object.keys(fields).map(async field => {
      let inputTypeField;

      if (inputType === 'create' && classGraphQLCreateTypeFields) {
        inputTypeField = classGraphQLCreateTypeFields[field];
      } else if (classGraphQLUpdateTypeFields) {
        inputTypeField = classGraphQLUpdateTypeFields[field];
      }

      if (inputTypeField) {
        switch (true) {
          case inputTypeField.type === defaultGraphQLTypes.GEO_POINT_INPUT:
            fields[field] = transformers.geoPoint(fields[field]);
            break;

          case inputTypeField.type === defaultGraphQLTypes.POLYGON_INPUT:
            fields[field] = transformers.polygon(fields[field]);
            break;

          case parseClass.fields[field].type === 'Relation':
            fields[field] = await transformers.relation(parseClass.fields[field].targetClass, field, fields[field], parseGraphQLSchema, req);
            break;

          case parseClass.fields[field].type === 'Pointer':
            fields[field] = await transformers.pointer(parseClass.fields[field].targetClass, field, fields[field], parseGraphQLSchema, req);
            break;
        }
      }
    });
    await Promise.all(promises);
    if (fields.ACL) fields.ACL = transformers.ACL(fields.ACL);
  }

  return fields;
};

exports.transformTypes = transformTypes;
const transformers = {
  polygon: value => ({
    __type: 'Polygon',
    coordinates: value.map(geoPoint => [geoPoint.latitude, geoPoint.longitude])
  }),
  geoPoint: value => _objectSpread({}, value, {
    __type: 'GeoPoint'
  }),
  ACL: value => {
    const parseACL = {};

    if (value.public) {
      parseACL['*'] = {
        read: value.public.read,
        write: value.public.write
      };
    }

    if (value.users) {
      value.users.forEach(rule => {
        parseACL[rule.userId] = {
          read: rule.read,
          write: rule.write
        };
      });
    }

    if (value.roles) {
      value.roles.forEach(rule => {
        parseACL[`role:${rule.roleName}`] = {
          read: rule.read,
          write: rule.write
        };
      });
    }

    return parseACL;
  },
  relation: async (targetClass, field, value, parseGraphQLSchema, {
    config,
    auth,
    info
  }) => {
    if (Object.keys(value) === 0) throw new Error(`You need to provide atleast one operation on the relation mutation of field ${field}`);
    const op = {
      __op: 'Batch',
      ops: []
    };
    let nestedObjectsToAdd = [];

    if (value.createAndAdd) {
      nestedObjectsToAdd = (await Promise.all(value.createAndAdd.map(async input => {
        const parseFields = await transformTypes('create', input, {
          className: targetClass,
          parseGraphQLSchema,
          req: {
            config,
            auth,
            info
          }
        });
        return objectsMutations.createObject(targetClass, parseFields, config, auth, info);
      }))).map(object => ({
        __type: 'Pointer',
        className: targetClass,
        objectId: object.objectId
      }));
    }

    if (value.add || nestedObjectsToAdd.length > 0) {
      if (!value.add) value.add = [];
      value.add = value.add.map(input => ({
        __type: 'Pointer',
        className: targetClass,
        objectId: input
      }));
      op.ops.push({
        __op: 'AddRelation',
        objects: [...value.add, ...nestedObjectsToAdd]
      });
    }

    if (value.remove) {
      op.ops.push({
        __op: 'RemoveRelation',
        objects: value.remove.map(input => ({
          __type: 'Pointer',
          className: targetClass,
          objectId: input
        }))
      });
    }

    return op;
  },
  pointer: async (targetClass, field, value, parseGraphQLSchema, {
    config,
    auth,
    info
  }) => {
    if (Object.keys(value) > 1 || Object.keys(value) === 0) throw new Error(`You need to provide link OR createLink on the pointer mutation of field ${field}`);
    let nestedObjectToAdd;

    if (value.createAndLink) {
      const parseFields = await transformTypes('create', value.createAndLink, {
        className: targetClass,
        parseGraphQLSchema,
        req: {
          config,
          auth,
          info
        }
      });
      nestedObjectToAdd = await objectsMutations.createObject(targetClass, parseFields, config, auth, info);
      return {
        __type: 'Pointer',
        className: targetClass,
        objectId: nestedObjectToAdd.objectId
      };
    }

    if (value.link) {
      return {
        __type: 'Pointer',
        className: targetClass,
        objectId: value.link
      };
    }
  }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9HcmFwaFFML3RyYW5zZm9ybWVycy9tdXRhdGlvbi5qcyJdLCJuYW1lcyI6WyJ0cmFuc2Zvcm1UeXBlcyIsImlucHV0VHlwZSIsImZpZWxkcyIsImNsYXNzTmFtZSIsInBhcnNlR3JhcGhRTFNjaGVtYSIsInJlcSIsImNsYXNzR3JhcGhRTENyZWF0ZVR5cGUiLCJjbGFzc0dyYXBoUUxVcGRhdGVUeXBlIiwiY29uZmlnIiwiaXNDcmVhdGVFbmFibGVkIiwiaXNVcGRhdGVFbmFibGVkIiwicGFyc2VDbGFzc1R5cGVzIiwicGFyc2VDbGFzcyIsInBhcnNlQ2xhc3NlcyIsImZpbmQiLCJjbGF6eiIsImNsYXNzR3JhcGhRTENyZWF0ZVR5cGVGaWVsZHMiLCJnZXRGaWVsZHMiLCJjbGFzc0dyYXBoUUxVcGRhdGVUeXBlRmllbGRzIiwicHJvbWlzZXMiLCJPYmplY3QiLCJrZXlzIiwibWFwIiwiZmllbGQiLCJpbnB1dFR5cGVGaWVsZCIsInR5cGUiLCJkZWZhdWx0R3JhcGhRTFR5cGVzIiwiR0VPX1BPSU5UX0lOUFVUIiwidHJhbnNmb3JtZXJzIiwiZ2VvUG9pbnQiLCJQT0xZR09OX0lOUFVUIiwicG9seWdvbiIsInJlbGF0aW9uIiwidGFyZ2V0Q2xhc3MiLCJwb2ludGVyIiwiUHJvbWlzZSIsImFsbCIsIkFDTCIsInZhbHVlIiwiX190eXBlIiwiY29vcmRpbmF0ZXMiLCJsYXRpdHVkZSIsImxvbmdpdHVkZSIsInBhcnNlQUNMIiwicHVibGljIiwicmVhZCIsIndyaXRlIiwidXNlcnMiLCJmb3JFYWNoIiwicnVsZSIsInVzZXJJZCIsInJvbGVzIiwicm9sZU5hbWUiLCJhdXRoIiwiaW5mbyIsIkVycm9yIiwib3AiLCJfX29wIiwib3BzIiwibmVzdGVkT2JqZWN0c1RvQWRkIiwiY3JlYXRlQW5kQWRkIiwiaW5wdXQiLCJwYXJzZUZpZWxkcyIsIm9iamVjdHNNdXRhdGlvbnMiLCJjcmVhdGVPYmplY3QiLCJvYmplY3QiLCJvYmplY3RJZCIsImFkZCIsImxlbmd0aCIsInB1c2giLCJvYmplY3RzIiwicmVtb3ZlIiwibmVzdGVkT2JqZWN0VG9BZGQiLCJjcmVhdGVBbmRMaW5rIiwibGluayJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFBOztBQUNBOzs7Ozs7Ozs7Ozs7QUFFQSxNQUFNQSxjQUFjLEdBQUcsT0FDckJDLFNBRHFCLEVBRXJCQyxNQUZxQixFQUdyQjtBQUFFQyxFQUFBQSxTQUFGO0FBQWFDLEVBQUFBLGtCQUFiO0FBQWlDQyxFQUFBQTtBQUFqQyxDQUhxQixLQUlsQjtBQUNILFFBQU07QUFDSkMsSUFBQUEsc0JBREk7QUFFSkMsSUFBQUEsc0JBRkk7QUFHSkMsSUFBQUEsTUFBTSxFQUFFO0FBQUVDLE1BQUFBLGVBQUY7QUFBbUJDLE1BQUFBO0FBQW5CO0FBSEosTUFJRk4sa0JBQWtCLENBQUNPLGVBQW5CLENBQW1DUixTQUFuQyxDQUpKO0FBS0EsUUFBTVMsVUFBVSxHQUFHUixrQkFBa0IsQ0FBQ1MsWUFBbkIsQ0FBZ0NDLElBQWhDLENBQ2pCQyxLQUFLLElBQUlBLEtBQUssQ0FBQ1osU0FBTixLQUFvQkEsU0FEWixDQUFuQjs7QUFHQSxNQUFJRCxNQUFKLEVBQVk7QUFDVixVQUFNYyw0QkFBNEIsR0FDaENQLGVBQWUsSUFBSUgsc0JBQW5CLEdBQ0lBLHNCQUFzQixDQUFDVyxTQUF2QixFQURKLEdBRUksSUFITjtBQUlBLFVBQU1DLDRCQUE0QixHQUNoQ1IsZUFBZSxJQUFJSCxzQkFBbkIsR0FDSUEsc0JBQXNCLENBQUNVLFNBQXZCLEVBREosR0FFSSxJQUhOO0FBSUEsVUFBTUUsUUFBUSxHQUFHQyxNQUFNLENBQUNDLElBQVAsQ0FBWW5CLE1BQVosRUFBb0JvQixHQUFwQixDQUF3QixNQUFNQyxLQUFOLElBQWU7QUFDdEQsVUFBSUMsY0FBSjs7QUFDQSxVQUFJdkIsU0FBUyxLQUFLLFFBQWQsSUFBMEJlLDRCQUE5QixFQUE0RDtBQUMxRFEsUUFBQUEsY0FBYyxHQUFHUiw0QkFBNEIsQ0FBQ08sS0FBRCxDQUE3QztBQUNELE9BRkQsTUFF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QUFBQSxHQUFHLEVBQUU7QUFBRUcsVUFBQUEsTUFBRjtBQUFVNkMsVUFBQUEsSUFBVjtBQUFnQkMsVUFBQUE7QUFBaEI7QUFIaUUsT0FBaEMsQ0FBeEM7QUFLQWtCLE1BQUFBLGlCQUFpQixHQUFHLE1BQU1ULGdCQUFnQixDQUFDQyxZQUFqQixDQUN4Qi9CLFdBRHdCLEVBRXhCNkIsV0FGd0IsRUFHeEJ0RCxNQUh3QixFQUl4QjZDLElBSndCLEVBS3hCQyxJQUx3QixDQUExQjtBQU9BLGFBQU87QUFDTGYsUUFBQUEsTUFBTSxFQUFFLFNBREg7QUFFTHBDLFFBQUFBLFNBQVMsRUFBRThCLFdBRk47QUFHTGlDLFFBQUFBLFFBQVEsRUFBRU0saUJBQWlCLENBQUNOO0FBSHZCLE9BQVA7QUFLRDs7QUFDRCxRQUFJNUIsS0FBSyxDQUFDb0MsSUFBVixFQUFnQjtBQUNkLGFBQU87QUFDTG5DLFFBQUFBLE1BQU0sRUFBRSxTQURIO0FBRUxwQyxRQUFBQSxTQUFTLEVBQUU4QixXQUZOO0FBR0xpQyxRQUFBQSxRQUFRLEVBQUU1QixLQUFLLENBQUNvQztBQUhYLE9BQVA7QUFLRDtBQUNGO0FBNUlrQixDQUFyQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGRlZmF1bHRHcmFwaFFMVHlwZXMgZnJvbSAnLi4vbG9hZGVycy9kZWZhdWx0R3JhcGhRTFR5cGVzJztcbmltcG9ydCAqIGFzIG9iamVjdHNNdXRhdGlvbnMgZnJvbSAnLi4vaGVscGVycy9vYmplY3RzTXV0YXRpb25zJztcblxuY29uc3QgdHJhbnNmb3JtVHlwZXMgPSBhc3luYyAoXG4gIGlucHV0VHlwZTogJ2NyZWF0ZScgfCAndXBkYXRlJyxcbiAgZmllbGRzLFxuICB7IGNsYXNzTmFtZSwgcGFyc2VHcmFwaFFMU2NoZW1hLCByZXEgfVxuKSA9PiB7XG4gIGNvbnN0IHtcbiAgICBjbGFzc0dyYXBoUUxDcmVhdGVUeXBlLFxuICAgIGNsYXNzR3JhcGhRTFVwZGF0ZVR5cGUsXG4gICAgY29uZmlnOiB7IGlzQ3JlYXRlRW5hYmxlZCwgaXNVcGRhdGVFbmFibGVkIH0sXG4gIH0gPSBwYXJzZUdyYXBoUUxTY2hlbWEucGFyc2VDbGFzc1R5cGVzW2NsYXNzTmFtZV07XG4gIGNvbnN0IHBhcnNlQ2xhc3MgPSBwYXJzZUdyYXBoUUxTY2hlbWEucGFyc2VDbGFzc2VzLmZpbmQoXG4gICAgY2xhenogPT4gY2xhenouY2xhc3NOYW1lID09PSBjbGFzc05hbWVcbiAgKTtcbiAgaWYgKGZpZWxkcykge1xuICAgIGNvbnN0IGNsYXNzR3JhcGhRTENyZWF0ZVR5cGVGaWVsZHMgPVxuICAgICAgaXNDcmVhdGVFbmFibGVkICYmIGNsYXNzR3JhcGhRTENyZWF0ZVR5cGVcbiAgICAgICAgPyBjbGFzc0dyYXBoUUxDcmVhdGVUeXBlLmdldEZpZWxkcygpXG4gICAgICAgIDogbnVsbDtcbiAgICBjb25zdCBjbGFzc0dyYXBoUUxVcGRhdGVUeXBlRmllbGRzID1cbiAgICAgIGlzVXBkYXRlRW5hYmxlZCAmJiBjbGFzc0dyYXBoUUxVcGRhdGVUeXBlXG4gICAgICAgID8gY2xhc3NHcmFwaFFMVXBkYXRlVHlwZS5nZXRGaWVsZHMoKVxuICAgICAgICA6IG51bGw7XG4gICAgY29uc3QgcHJvbWlzZXMgPSBPYmplY3Qua2V5cyhmaWVsZHMpLm1hcChhc3luYyBmaWVsZCA9PiB7XG4gICAgICBsZXQgaW5wdXRUeXBlRmllbGQ7XG4gICAgICBpZiAoaW5wdXRUeXBlID09PSAnY3JlYXRlJyAmJiBjbGFzc0dyYXBoUUxDcmVhdGVUeXBlRmllbGRzKSB7XG4gICAgICAgIGlucHV0VHlwZUZpZWxkID0gY2xhc3NHcmFwaFFMQ3JlYXRlVHlwZUZpZWxkc1tmaWVsZF07XG4gICAgICB9IGVsc2UgaWYgKGNsYXNzR3JhcGhRTFVwZGF0ZVR5cGVGaWVsZHMpIHtcbiAgICAgICAgaW5wdXRUeXBlRmllbGQgPSBjbGFzc0dyYXBoUUxVcGRhdGVUeXBlRmllbGRzW2ZpZWxkXTtcbiAgICAgIH1cbiAgICAgIGlmIChpbnB1dFR5cGVGaWVsZCkge1xuICAgICAgICBzd2l0Y2ggKHRydWUpIHtcbiAgICAgICAgICBjYXNlIGlucHV0VHlwZUZpZWxkLnR5cGUgPT09IGRlZmF1bHRHcmFwaFFMVHlwZXMuR0VPX1BPSU5UX0lOUFVUOlxuICAgICAgICAgICAgZmllbGRzW2ZpZWxkXSA9IHRyYW5zZm9ybWVycy5nZW9Qb2ludChmaWVsZHNbZmllbGRdKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgaW5wdXRUeXBlRmllbGQudHlwZSA9PT0gZGVmYXVsdEdyYXBoUUxUeXBlcy5QT0xZR09OX0lOUFVUOlxuICAgICAgICAgICAgZmllbGRzW2ZpZWxkXSA9IHRyYW5zZm9ybWVycy5wb2x5Z29uKGZpZWxkc1tmaWVsZF0pO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBwYXJzZUNsYXNzLmZpZWxkc1tmaWVsZF0udHlwZSA9PT0gJ1JlbGF0aW9uJzpcbiAgICAgICAgICAgIGZpZWxkc1tmaWVsZF0gPSBhd2FpdCB0cmFuc2Zvcm1lcnMucmVsYXRpb24oXG4gICAgICAgICAgICAgIHBhcnNlQ2xhc3MuZmllbGRzW2ZpZWxkXS50YXJnZXRDbGFzcyxcbiAgICAgICAgICAgICAgZmllbGQsXG4gICAgICAgICAgICAgIGZpZWxkc1tmaWVsZF0sXG4gICAgICAgICAgICAgIHBhcnNlR3JhcGhRTFNjaGVtYSxcbiAgICAgICAgICAgICAgcmVxXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBwYXJzZUNsYXNzLmZpZWxkc1tmaWVsZF0udHlwZSA9PT0gJ1BvaW50ZXInOlxuICAgICAgICAgICAgZmllbGRzW2ZpZWxkXSA9IGF3YWl0IHRyYW5zZm9ybWVycy5wb2ludGVyKFxuICAgICAgICAgICAgICBwYXJzZUNsYXNzLmZpZWxkc1tmaWVsZF0udGFyZ2V0Q2xhc3MsXG4gICAgICAgICAgICAgIGZpZWxkLFxuICAgICAgICAgICAgICBmaWVsZHNbZmllbGRdLFxuICAgICAgICAgICAgICBwYXJzZUdyYXBoUUxTY2hlbWEsXG4gICAgICAgICAgICAgIHJlcVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgYXdhaXQgUHJvbWlzZS5hbGwocHJvbWlzZXMpO1xuICAgIGlmIChmaWVsZHMuQUNMKSBmaWVsZHMuQUNMID0gdHJhbnNmb3JtZXJzLkFDTChmaWVsZHMuQUNMKTtcbiAgfVxuICByZXR1cm4gZmllbGRzO1xufTtcblxuY29uc3QgdHJhbnNmb3JtZXJzID0ge1xuICBwb2x5Z29uOiB2YWx1ZSA9PiAoe1xuICAgIF9fdHlwZTogJ1BvbHlnb24nLFxuICAgIGNvb3JkaW5hdGVzOiB2YWx1ZS5tYXAoZ2VvUG9pbnQgPT4gW2dlb1BvaW50LmxhdGl0dWRlLCBnZW9Qb2ludC5sb25naXR1ZGVdKSxcbiAgfSksXG4gIGdlb1BvaW50OiB2YWx1ZSA9PiAoe1xuICAgIC4uLnZhbHVlLFxuICAgIF9fdHlwZTogJ0dlb1BvaW50JyxcbiAgfSksXG4gIEFDTDogdmFsdWUgPT4ge1xuICAgIGNvbnN0IHBhcnNlQUNMID0ge307XG4gICAgaWYgKHZhbHVlLnB1YmxpYykge1xuICAgICAgcGFyc2VBQ0xbJyonXSA9IHtcbiAgICAgICAgcmVhZDogdmFsdWUucHVibGljLnJlYWQsXG4gICAgICAgIHdyaXRlOiB2YWx1ZS5wdWJsaWMud3JpdGUsXG4gICAgICB9O1xuICAgIH1cbiAgICBpZiAodmFsdWUudXNlcnMpIHtcbiAgICAgIHZhbHVlLnVzZXJzLmZvckVhY2gocnVsZSA9PiB7XG4gICAgICAgIHBhcnNlQUNMW3J1bGUudXNlcklkXSA9IHtcbiAgICAgICAgICByZWFkOiBydWxlLnJlYWQsXG4gICAgICAgICAgd3JpdGU6IHJ1bGUud3JpdGUsXG4gICAgICAgIH07XG4gICAgICB9KTtcbiAgICB9XG4gICAgaWYgKHZhbHVlLnJvbGVzKSB7XG4gICAgICB2YWx1ZS5yb2xlcy5mb3JFYWNoKHJ1bGUgPT4ge1xuICAgICAgICBwYXJzZUFDTFtgcm9sZToke3J1bGUucm9sZU5hbWV9YF0gPSB7XG4gICAgICAgICAgcmVhZDogcnVsZS5yZWFkLFxuICAgICAgICAgIHdyaXRlOiBydWxlLndyaXRlLFxuICAgICAgICB9O1xuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBwYXJzZUFDTDtcbiAgfSxcbiAgcmVsYXRpb246IGFzeW5jIChcbiAgICB0YXJnZXRDbGFzcyxcbiAgICBmaWVsZCxcbiAgICB2YWx1ZSxcbiAgICBwYXJzZUdyYXBoUUxTY2hlbWEsXG4gICAgeyBjb25maWcsIGF1dGgsIGluZm8gfVxuICApID0+IHtcbiAgICBpZiAoT2JqZWN0LmtleXModmFsdWUpID09PSAwKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgWW91IG5lZWQgdG8gcHJvdmlkZSBhdGxlYXN0IG9uZSBvcGVyYXRpb24gb24gdGhlIHJlbGF0aW9uIG11dGF0aW9uIG9mIGZpZWxkICR7ZmllbGR9YFxuICAgICAgKTtcblxuICAgIGNvbnN0IG9wID0ge1xuICAgICAgX19vcDogJ0JhdGNoJyxcbiAgICAgIG9wczogW10sXG4gICAgfTtcbiAgICBsZXQgbmVzdGVkT2JqZWN0c1RvQWRkID0gW107XG5cbiAgICBpZiAodmFsdWUuY3JlYXRlQW5kQWRkKSB7XG4gICAgICBuZXN0ZWRPYmplY3RzVG9BZGQgPSAoYXdhaXQgUHJvbWlzZS5hbGwoXG4gICAgICAgIHZhbHVlLmNyZWF0ZUFuZEFkZC5tYXAoYXN5bmMgaW5wdXQgPT4ge1xuICAgICAgICAgIGNvbnN0IHBhcnNlRmllbGRzID0gYXdhaXQgdHJhbnNmb3JtVHlwZXMoJ2NyZWF0ZScsIGlucHV0LCB7XG4gICAgICAgICAgICBjbGFzc05hbWU6IHRhcmdldENsYXNzLFxuICAgICAgICAgICAgcGFyc2VHcmFwaFFMU2NoZW1hLFxuICAgICAgICAgICAgcmVxOiB7IGNvbmZpZywgYXV0aCwgaW5mbyB9LFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiBvYmplY3RzTXV0YXRpb25zLmNyZWF0ZU9iamVjdChcbiAgICAgICAgICAgIHRhcmdldENsYXNzLFxuICAgICAgICAgICAgcGFyc2VGaWVsZHMsXG4gICAgICAgICAgICBjb25maWcsXG4gICAgICAgICAgICBhdXRoLFxuICAgICAgICAgICAgaW5mb1xuICAgICAgICAgICk7XG4gICAgICAgIH0pXG4gICAgICApKS5tYXAob2JqZWN0ID0+ICh7XG4gICAgICAgIF9fdHlwZTogJ1BvaW50ZXInLFxuICAgICAgICBjbGFzc05hbWU6IHRhcmdldENsYXNzLFxuICAgICAgICBvYmplY3RJZDogb2JqZWN0Lm9iamVjdElkLFxuICAgICAgfSkpO1xuICAgIH1cblxuICAgIGlmICh2YWx1ZS5hZGQgfHwgbmVzdGVkT2JqZWN0c1RvQWRkLmxlbmd0aCA+IDApIHtcbiAgICAgIGlmICghdmFsdWUuYWRkKSB2YWx1ZS5hZGQgPSBbXTtcbiAgICAgIHZhbHVlLmFkZCA9IHZhbHVlLmFkZC5tYXAoaW5wdXQgPT4gKHtcbiAgICAgICAgX190eXBlOiAnUG9pbnRlcicsXG4gICAgICAgIGNsYXNzTmFtZTogdGFyZ2V0Q2xhc3MsXG4gICAgICAgIG9iamVjdElkOiBpbnB1dCxcbiAgICAgIH0pKTtcbiAgICAgIG9wLm9wcy5wdXNoKHtcbiAgICAgICAgX19vcDogJ0FkZFJlbGF0aW9uJyxcbiAgICAgICAgb2JqZWN0czogWy4uLnZhbHVlLmFkZCwgLi4ubmVzdGVkT2JqZWN0c1RvQWRkXSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICh2YWx1ZS5yZW1vdmUpIHtcbiAgICAgIG9wLm9wcy5wdXNoKHtcbiAgICAgICAgX19vcDogJ1JlbW92ZVJlbGF0aW9uJyxcbiAgICAgICAgb2JqZWN0czogdmFsdWUucmVtb3ZlLm1hcChpbnB1dCA9PiAoe1xuICAgICAgICAgIF9fdHlwZTogJ1BvaW50ZXInLFxuICAgICAgICAgIGNsYXNzTmFtZTogdGFyZ2V0Q2xhc3MsXG4gICAgICAgICAgb2JqZWN0SWQ6IGlucHV0LFxuICAgICAgICB9KSksXG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIG9wO1xuICB9LFxuICBwb2ludGVyOiBhc3luYyAoXG4gICAgdGFyZ2V0Q2xhc3MsXG4gICAgZmllbGQsXG4gICAgdmFsdWUsXG4gICAgcGFyc2VHcmFwaFFMU2NoZW1hLFxuICAgIHsgY29uZmlnLCBhdXRoLCBpbmZvIH1cbiAgKSA9PiB7XG4gICAgaWYgKE9iamVjdC5rZXlzKHZhbHVlKSA+IDEgfHwgT2JqZWN0LmtleXModmFsdWUpID09PSAwKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgWW91IG5lZWQgdG8gcHJvdmlkZSBsaW5rIE9SIGNyZWF0ZUxpbmsgb24gdGhlIHBvaW50ZXIgbXV0YXRpb24gb2YgZmllbGQgJHtmaWVsZH1gXG4gICAgICApO1xuXG4gICAgbGV0IG5lc3RlZE9iamVjdFRvQWRkO1xuICAgIGlmICh2YWx1ZS5jcmVhdGVBbmRMaW5rKSB7XG4gICAgICBjb25zdCBwYXJzZUZpZWxkcyA9IGF3YWl0IHRyYW5zZm9ybVR5cGVzKCdjcmVhdGUnLCB2YWx1ZS5jcmVhdGVBbmRMaW5rLCB7XG4gICAgICAgIGNsYXNzTmFtZTogdGFyZ2V0Q2xhc3MsXG4gICAgICAgIHBhcnNlR3JhcGhRTFNjaGVtYSxcbiAgICAgICAgcmVxOiB7IGNvbmZpZywgYXV0aCwgaW5mbyB9LFxuICAgICAgfSk7XG4gICAgICBuZXN0ZWRPYmplY3RUb0FkZCA9IGF3YWl0IG9iamVjdHNNdXRhdGlvbnMuY3JlYXRlT2JqZWN0KFxuICAgICAgICB0YXJnZXRDbGFzcyxcbiAgICAgICAgcGFyc2VGaWVsZHMsXG4gICAgICAgIGNvbmZpZyxcbiAgICAgICAgYXV0aCxcbiAgICAgICAgaW5mb1xuICAgICAgKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIF9fdHlwZTogJ1BvaW50ZXInLFxuICAgICAgICBjbGFzc05hbWU6IHRhcmdldENsYXNzLFxuICAgICAgICBvYmplY3RJZDogbmVzdGVkT2JqZWN0VG9BZGQub2JqZWN0SWQsXG4gICAgICB9O1xuICAgIH1cbiAgICBpZiAodmFsdWUubGluaykge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgX190eXBlOiAnUG9pbnRlcicsXG4gICAgICAgIGNsYXNzTmFtZTogdGFyZ2V0Q2xhc3MsXG4gICAgICAgIG9iamVjdElkOiB2YWx1ZS5saW5rLFxuICAgICAgfTtcbiAgICB9XG4gIH0sXG59O1xuXG5leHBvcnQgeyB0cmFuc2Zvcm1UeXBlcyB9O1xuIl19