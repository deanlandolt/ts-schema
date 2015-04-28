var assert = require('assert');
var compiler = require('tsreflect-compiler');
var fs = require('fs');
var resolve = require('path').resolve;
var xtend = require('xtend');

//
// split comment body text into title and description parts
//
function getMetadata(source) {
  var metadata = {};

  if (!source || typeof source !== 'object') {
    return metadata;
  }
  
  if (source.description) {
    var paragraphs = source.description.split(/\r?\n\r?\n/);
    metadata.title = paragraphs[0];
    if (paragraphs.length > 1) {
      metadata.description = paragraphs.slice(1).join('\n\n');
    }
  }

  if (source.annotations) {
    var options = metadata.options = {};
    source.annotations.forEach(function (annotation) {
       options[annotation.name] = annotation.value;
    });
  }

  return metadata;
}

function processArray(items, metadata) {
  // TODO: minLength, maxLength
  return {
    type: 'array',
    items: processType(items, metadata)
  };
}

function processType(source, metadata) {
  if (typeof source === 'string') {
    return types[source]({ type: source }, metadata);
  }

  if (source.kind) {
    return processKind(source, metadata);
  }

  assert.equal(null, source, 'Unknown type');
}

var types = {};

types.Date = function (source, metadata) {
  return xtend(metadata, {
    type: 'string',
    format: 'date-time'
  });
};

function processPrimitive(source, metadata) {
  var type = source.type === 'void' ? 'null' : source.type;
  if (metadata && Object.keys(metadata).length) {
    return xtend(metadata, { type: type });
  }
  return type;
}

types.string = types.number = types.boolean = types.void = processPrimitive;

function processObject(source) {
  return xtend(getMetadata(source), {
    type: 'object',
    properties: {}
  });
}

function processProperty(source) {
  return processType(source.type, getMetadata(source));
}


var kinds = {};

function processKind(source, metadata) {
  return kinds[source.kind](source, metadata);
}

//
// return a $ref pointer to relative schema path
//
kinds.import = function (source) {
  return { $ref: source.require.replace(/['"]/g, '') + '.schema.json' };
};

kinds.alias = function (source, metadata) {
  return processKind(source.type, xtend(metadata, getMetadata(source)));
};

kinds.array = function (source, metadata) {
  return processArray(source.type, metadata);
};

kinds.reference = function (source, metadata) {
  if (source.type === 'Array') {
    return processArray(source.arguments[0], metadata);
  }
  assert.equal(null, source, 'Unknown reference type: ' + source.type);
};

kinds.union = function (source) {
  return source.types.map(function (type) {
    return processType(type, getMetadata(type));
  });
};

kinds.class = function (source, metadata) {
  var result = processObject(source, metadata);

  if (source.implements) {
    result.allOf = source.implements.map(function (ref) {
      return { $ref: '#/definitions/' + ref.replace(/\./g, '/') };
    });
  }
  
  var required = [];
  (source.members || []).forEach(function (member) {
    assert.equal(member.kind, 'field', 'Unrecognized member kind');

    //
    // all class members are required (though they can be nullable)
    //
    required.push(member.name);

    result.properties[member.name] = processProperty(member);
  });

  if (required.length) {
    result.required = required;
  }

  return result;
};

kinds.interface = function (source) {
  var result = processObject(source);

  var required = [];
  (source.signatures || []).forEach(function (signature) {
    assert.equal(signature.kind, 'property', 'Unrecognized signature kind');

    if (!signature.optional) {
      required.push(signature.name);
    }

    result.properties[signature.name] = processProperty(signature);
  });

  if (required.length) {
    result.required = required;
  }

  return result;
};

function buildSchema(sources) {
  if (!sources || !sources.external) {
    return;
  }
  var schema = {
    $schema: 'http://json-schema.org/draft-04/schema#'
  };

  sources.declares.forEach(function (source) {
    var result = processKind(source, source);

    //
    // top leve of schema is for exported value
    //
    if (sources.exportName && sources.exportName === source.name) {
      for (var key in result) {
        schema[key] = result[key]
      }
    }
    else {
      schema.definitions || (schema.definitions = {});
      schema.definitions[source.name] = result;
    }
  });

  return schema;
}

module.exports = function (paths, options) {
  options || (options = {});

  var cache = {};
  var results = {};
  var compilerHost = {};
  compilerHost.readFile = function (path, onError) {
    var text;
    if (text = cache[path]) {
      return text;
    }
    try {
      text = cache[path] = fs.readFileSync(path, 'utf8');
    }
    catch (e) {
      if (onError) {
        onError(e.message);
      }
      text = '';
    }
    return text;
  };

  compilerHost.writeFile = function (path, string) {
    //
    // build json schema
    //
    var sources = JSON.parse(string);
    var schema = buildSchema(sources);

    //
    // internal schemas have no schema value, exit early
    //
    if (!schema) {
      return;
    }
    var baseName = path.replace(/\.d\.json$/, '');

    if (options.noWrite) {
      //
      // collect up generated results
      //
      results[baseName] = {
        sources: sources,
        schema: schema
      };
    }
    else {
      //
      // write generated d.json and schema.json files
      //
      fs.writeFileSync(path, string);

      var serialized = JSON.stringify(schema, null, '  ');
      fs.writeFileSync(baseName + '.schema.json', serialized);
    }
  };

  //
  // compile provided paths (may be a single path string)
  //
  Array.isArray(paths) || (paths = [ paths ]);

  var output = compiler.compile(paths.map(function (path) {
    return resolve(path);
  }), options, compilerHost);

  if (output.length) {
    throw new Error(output);
  }

  //
  // return results by base path if `noWrite` option specified
  //
  if (options.noWrite) {
    return paths.map(function (path) {
      return results[path.replace(/\.ts$/, '')];
    });
  }
};
