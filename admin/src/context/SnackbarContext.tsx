import {
  createContext,
  type FC,
  type ReactNode,
  useCallback,
  useMemo,
  useState,
} from "react";
import { Alert, type AlertProps, Snackbar } from "@mui/material";

type SnackbarOption = {
  isOpen?: boolean;
  text: string;
} & Pick<AlertProps, "severity">;

type OpenSnackbarOption = Required<Omit<SnackbarOption, "isOpen">>;

const initialSnackbarOption: SnackbarOption = {
  isOpen: false,
  text: "",
  severity: "info",
};

const SnackbarContext = createContext<SnackbarOption>(initialSnackbarOption);

export const SetSnackbarOptionContext = createContext<
  (option: OpenSnackbarOption) => void
>(() => {});

export const SnackbarProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [snackbarOption, setSnackbarOption] = useState<SnackbarOption>(
    initialSnackbarOption
  );

  const openSnackbar = useCallback((option: OpenSnackbarOption) => {
    setSnackbarOption((prev) => ({ ...prev, ...option, isOpen: true }));
  }, []);

  const closeSnackbar = useCallback(
    () => setSnackbarOption((prev) => ({ ...prev, isOpen: false })),
    []
  );

  const memoizedChildren = useMemo(() => children, [children]);

  return (
    <SnackbarContext.Provider value={snackbarOption}>
      <SetSnackbarOptionContext.Provider value={openSnackbar}>
        {memoizedChildren}
        <Snackbar
          open={snackbarOption.isOpen}
          autoHideDuration={6000}
          onClose={closeSnackbar}
        >
          <Alert
            onClose={closeSnackbar}
            severity={snackbarOption.severity}
            sx={{ width: "100%" }}
          >
            {snackbarOption.text}
          </Alert>
        </Snackbar>
      </SetSnackbarOptionContext.Provider>
    </SnackbarContext.Provider>
  );
};
