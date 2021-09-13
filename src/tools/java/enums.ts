import { Kind } from "../..";
import { indent } from "./utils";
import { TypeDefinitionStrictWithSize, TypeMapping } from "./types";
import {
  header,
  javaTypeMapping,
  typesToByteOperators,
  typesToJsonOperators,
} from "./utils";

const getEnumMembers = (typeDef: TypeDefinitionStrictWithSize) => {
  if (typeDef.kind === Kind.Enum) {
    return typeDef.variants
      .map(
        (v) => `
${indent(1)}${v[0].toUpperCase()}(${v[1]}),`
      )
      .concat([
        !!typeDef.variants.find((v) => v[0].toUpperCase() === "UNKNOWN")
          ? ";"
          : `
${indent(1)}UNKNOWN(99999);`,
      ])
      .join("");
  } else {
    return "";
  }
};

const getEnumMethods = (
  typeDef: TypeDefinitionStrictWithSize,
  typeMap: TypeMapping,
  javaType: string
) => {
  if (typeDef.kind === Kind.Enum) {
    const byteOperators = typesToByteOperators(
      [],
      "value",
      typeDef.underlying,
      typeMap,
      typeDef.size,
      0
    );
    return `
${indent(1)}private static Map<Integer, ${
      typeDef.name
    }> TYPES = new HashMap<>();
${indent(1)}static {
${indent(2)}for (${typeDef.name} type : ${typeDef.name}.values()) {
${indent(3)}TYPES.put(type.value, type);
${indent(2)}}
${indent(1)}}


${indent(1)}${typeDef.name}(${javaType} newValue) {
${indent(2)}value = newValue;
${indent(1)}}

${indent(1)}/**
${indent(1)} Get ${typeDef.name} from java input
${indent(1)} * @param newValue
${indent(1)} * @return ${typeDef.name} enum
${indent(1)} */
${indent(1)}public static ${typeDef.name} get${
      typeDef.name
    }(${javaType} newValue) {
${indent(2)}${typeDef.name} val = TYPES.get(newValue);
${indent(2)}return val == null ? ${typeDef.name}.UNKNOWN : val;
${indent(1)}}

${indent(1)}/**
${indent(1)} Get ${typeDef.name} from bytes
${indent(1)} * @param bytes byte[]
${indent(1)} * @param offset - int
${indent(1)} */
${indent(1)}public static ${typeDef.name} get${
      typeDef.name
    }(byte[] bytes, int offset) {
${indent(2)}return get${typeDef.name}(${
      byteOperators.read.split(";")[0].split("= ")[1]
    });
${indent(1)}}

${indent(1)}/**
${indent(1)} * Get ${typeDef.name} int value
${indent(1)} * @return int value
${indent(1)} */
${indent(1)}public ${javaType} get${typeDef.name}Value() { return value; }

${indent(1)}byte[] toBytes() {
${indent(2)}ByteBuffer buffer = ByteBuffer.allocate(this.byteLength);
${indent(2)}${byteOperators.write}
${indent(2)}return buffer.array();
${indent(1)}}

${indent(1)}void toBytes(ByteBuffer buffer) {
${indent(2)}${byteOperators.write}
${indent(1)}}
`;
  } else {
    return "";
  }
};

const getEnumJsonMethods = (
  typeDef: TypeDefinitionStrictWithSize,
  typeMap: TypeMapping
) => {
  if (typeDef.kind === Kind.Enum) {
    const jsonOperators = typesToJsonOperators(
      "value",
      typeDef.underlying,
      typeMap,
      0
    );
    return `

${indent(1)}public ObjectNode toJson() {
${indent(2)}ObjectMapper mapper = new ObjectMapper();
${indent(2)}ObjectNode object = mapper.createObjectNode();
${indent(2)}${jsonOperators.write}
${indent(2)}return object;
${indent(1)}}

${indent(1)}public ObjectNode toJson(ObjectNode object) {
${indent(2)}${jsonOperators.write}
${indent(2)}return object;
${indent(1)}}
`;
  } else {
    return "";
  }
};

export const getEnum = (
  typeDef: TypeDefinitionStrictWithSize,
  typeMap: TypeMapping,
  withJson: boolean,
  packageName?: string
) => {
  if (typeDef.kind === Kind.Enum) {
    const javaTypeName = javaTypeMapping(
      typeMap[typeDef.underlying] || typeDef.underlying
    );
    return `${header(withJson, packageName)}
/**
 * Enum: ${typeDef.name}
 * ${typeDef.desc}
 */
public enum ${typeDef.name} {

${getEnumMembers(typeDef)}

${indent(1)}private final ${javaTypeName} value;

${indent(1)}private final int byteLength = ${typeDef.size};

${getEnumMethods(typeDef, typeMap, javaTypeName)}

${withJson ? getEnumJsonMethods(typeDef, typeMap) : ""}

}
`;
  } else {
    return "";
  }
};
