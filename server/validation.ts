import isArrayLike from "lodash/isArrayLike";
import sanitize from "sanitize-filename";
import { Primitive } from "utility-types";
import validator from "validator";
import isIn from "validator/lib/isIn";
import isUUID from "validator/lib/isUUID";
import parseMentionUrl from "@shared/utils/parseMentionUrl";
import { SLUG_URL_REGEX } from "@shared/utils/urlHelpers";
import { isUrl } from "@shared/utils/urls";
import { CollectionPermission } from "../shared/types";
import { validateColorHex } from "../shared/utils/color";
import { validateIndexCharacters } from "../shared/utils/indexCharacters";
import { ParamRequiredError, ValidationError } from "./errors";

type IncomingValue = Primitive | string[];

export const assertPresent = (value: IncomingValue, message: string) => {
  if (value === undefined || value === null || value === "") {
    throw ParamRequiredError(message);
  }
};

export function assertArray(
  value: IncomingValue,
  message?: string
): asserts value {
  if (!isArrayLike(value)) {
    throw ValidationError(message);
  }
}

export const assertIn = (
  value: string,
  options: Primitive[],
  message?: string
) => {
  if (!options.includes(value)) {
    throw ValidationError(message ?? `Must be one of ${options.join(", ")}`);
  }
};

/**
 * Asserts that an object contains no other keys than specified
 * by a type
 *
 * @param obj The object to check for assertion
 * @param type The type to check against
 * @throws {ValidationError}
 */
export function assertKeysIn(
  obj: Record<string, unknown>,
  type: { [key: string]: number | string }
) {
  Object.keys(obj).forEach((key) => assertIn(key, Object.values(type)));
}

export const assertSort = (
  value: string,
  model: any,
  message = "Invalid sort parameter"
) => {
  if (!Object.keys(model.rawAttributes).includes(value)) {
    throw ValidationError(message);
  }
};

export function assertNotEmpty(
  value: IncomingValue,
  message: string
): asserts value {
  assertPresent(value, message);

  if (typeof value === "string" && value.trim() === "") {
    throw ValidationError(message);
  }
}

export function assertEmail(
  value: IncomingValue = "",
  message?: string
): asserts value {
  if (typeof value !== "string" || !validator.isEmail(value)) {
    throw ValidationError(message);
  }
}

export function assertUrl(
  value: IncomingValue = "",
  message?: string
): asserts value {
  if (
    typeof value !== "string" ||
    !validator.isURL(value, {
      protocols: ["http", "https"],
      require_valid_protocol: true,
    })
  ) {
    throw ValidationError(message ?? `${String(value)} is an invalid url`);
  }
}

/**
 * Asserts that the passed value is a valid boolean
 *
 * @param value The value to check for assertion
 * @param [message] The error message to show
 * @throws {ValidationError}
 */
export function assertBoolean(
  value: IncomingValue,
  message?: string
): asserts value {
  if (typeof value !== "boolean") {
    throw ValidationError(message ?? `${String(value)} is not a boolean`);
  }
}

export function assertUuid(
  value: IncomingValue,
  message?: string
): asserts value {
  if (typeof value !== "string") {
    throw ValidationError(message);
  }
  if (!validator.isUUID(value)) {
    throw ValidationError(message);
  }
}

export const assertPositiveInteger = (
  value: IncomingValue,
  message?: string
) => {
  if (
    !validator.isInt(String(value), {
      min: 0,
    })
  ) {
    throw ValidationError(message);
  }
};

export const assertHexColor = (value: string, message?: string) => {
  if (!validateColorHex(value)) {
    throw ValidationError(message);
  }
};

export const assertValueInArray = (
  value: string,
  values: string[],
  message?: string
) => {
  if (!values.includes(value)) {
    throw ValidationError(message);
  }
};

export const assertIndexCharacters = (
  value: string,
  message = "index must be between x20 to x7E ASCII"
) => {
  if (!validateIndexCharacters(value)) {
    throw ValidationError(message);
  }
};

export const assertCollectionPermission = (
  value: string,
  message = "Invalid permission"
) => {
  assertIn(value, [...Object.values(CollectionPermission), null], message);
};

export class ValidateKey {
  public static isValid = (key: string) => {
    const parts = key.split("/").slice(0, -1);
    return (
      parts.length === 3 &&
      isIn(parts[0], ["uploads", "public"]) &&
      isUUID(parts[1]) &&
      isUUID(parts[2])
    );
  };

  public static sanitize = (key: string) => {
    const [filename] = key.split("/").slice(-1);
    return key
      .split("/")
      .slice(0, -1)
      .join("/")
      .concat(`/${sanitize(filename)}`);
  };

  public static message =
    "Must be of the form uploads/<uuid>/<uuid>/<name> or public/<uuid>/<uuid>/<name>";
}

export class ValidateDocumentId {
  /**
   * Checks if documentId is valid. A valid documentId is either
   * a UUID or a url slug matching a particular regex.
   *
   * @param documentId
   * @returns true if documentId is valid, false otherwise
   */
  public static isValid = (documentId: string) =>
    isUUID(documentId) || SLUG_URL_REGEX.test(documentId);

  public static message = "Must be uuid or url slug";
}

export class ValidateIndex {
  public static regex = new RegExp("^[\x20-\x7E]+$");
  public static message = "Must be between x20 to x7E ASCII";
  public static maxLength = 100;
}

export class ValidateURL {
  public static isValidMentionUrl = (url: string) => {
    if (!isUrl(url)) {
      return false;
    }
    try {
      const urlObj = new URL(url);
      if (urlObj.protocol !== "mention:") {
        return false;
      }

      const { id, mentionType, modelId } = parseMentionUrl(url);
      return id && isUUID(id) && mentionType === "user" && isUUID(modelId);
    } catch (err) {
      return false;
    }
  };

  public static message = "Must be a valid url";
}

export class ValidateColor {
  public static regex = /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i;
  public static message = "Must be a hex value (please use format #FFFFFF)";
}

export class ValidateIcon {
  public static maxLength = 50;
}
