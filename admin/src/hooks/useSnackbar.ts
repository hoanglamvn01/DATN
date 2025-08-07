import { useContext } from "react";
import { SetSnackbarOptionContext } from "../context/SnackbarContext.tsx";

export const useSnackbar = () => ({
  openSnackbar: useContext(SetSnackbarOptionContext),
});
