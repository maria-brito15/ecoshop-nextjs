// lib/errors/domain.ts

/**
 * Typed domain errors (Constitution, Art. VII.1).
 *
 * Services throw these errors; the single mapper (`mapError`, in
 * `lib/http/responses.ts`) converts them into an HTTP response. The response is
 * never decided from the message text (Art. VII.2).
 *
 * There are two classes because the current cases only call for two outcomes: a
 * resource that does not exist (404) and a conflict with the current state (409:
 * duplicate email, brand no longer pending, a link that blocks the operation...).
 */

/** The requested resource does not exist. Becomes 404 with the message `<resource> not found`. */
export class ResourceNotFound extends Error {
  constructor(readonly resource: string) {
    super(`${resource} not found`);
    this.name = "ResourceNotFound";
  }
}

/** The operation conflicts with the current state. Becomes 409 with its own message (already written for the user). */
export class BusinessConflict extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BusinessConflict";
  }
}

/** The person is authenticated but cannot do THIS (e.g. wrong current password). Becomes 403 with its own message. */
export class OperationNotAllowed extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OperationNotAllowed";
  }
}
