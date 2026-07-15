import { Alert } from "react-native";
import { handleError } from "../../lib/ui/handleError";

jest.spyOn(Alert, "alert").mockImplementation(() => {});
const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

afterEach(() => {
  jest.clearAllMocks();
});

describe("handleError", () => {
  it("logs error to console in all environments (not just __DEV__)", () => {
    const err = new Error("test failure");
    handleError("TestTitle", err);
    expect(consoleSpy).toHaveBeenCalledWith("[TestTitle]", err);
  });

  it("shows alert with error message", () => {
    const err = new Error("something broke");
    handleError("Oops", err);
    expect(Alert.alert).toHaveBeenCalledWith("Oops", "something broke");
  });

  it("uses fallback message when error has no message", () => {
    handleError("Oops", "raw string error", "Default msg");
    expect(Alert.alert).toHaveBeenCalledWith("Oops", "Default msg");
  });

  it("uses 'Unknown error' as default fallback", () => {
    handleError("Oops", null);
    expect(Alert.alert).toHaveBeenCalledWith("Oops", "Unknown error");
  });

  it("extracts message from error-like object", () => {
    handleError("Title", { message: "custom msg" });
    expect(Alert.alert).toHaveBeenCalledWith("Title", "custom msg");
  });
});
