export function mapFieldErrors(errors: unknown[]): Array<{ message: string }> {
    return errors.flatMap((error) => {
        if (typeof error === "string") {
            return [{ message: error }];
        }

        if (error instanceof Error) {
            return [{ message: error.message }];
        }

        return [];
    });
}
