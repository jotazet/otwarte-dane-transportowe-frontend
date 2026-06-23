"use client";

import * as React from "react";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField, { type TextFieldProps } from "@mui/material/TextField";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";

type PasswordTextFieldProps = TextFieldProps & {
  showPasswordLabel?: string;
  hidePasswordLabel?: string;
};

export function PasswordTextField({
  showPasswordLabel = "Show password",
  hidePasswordLabel = "Hide password",
  slotProps,
  ...props
}: PasswordTextFieldProps) {
  const [show, setShow] = React.useState(false);
  const inputSlot = slotProps?.input;
  const inputProps = typeof inputSlot === "object" && inputSlot != null ? inputSlot : {};
  const existingEndAdornment =
    "endAdornment" in inputProps ? inputProps.endAdornment : undefined;

  return (
    <TextField
      {...props}
      type={show ? "text" : "password"}
      slotProps={{
        ...slotProps,
        input: {
          ...inputProps,
          endAdornment: (
            <>
              {existingEndAdornment}
              <InputAdornment position="end">
                <IconButton
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  edge="end"
                  aria-label={show ? hidePasswordLabel : showPasswordLabel}
                  tabIndex={-1}
                  size="small"
                >
                  {show ? <MdVisibilityOff size={22} aria-hidden /> : <MdVisibility size={22} aria-hidden />}
                </IconButton>
              </InputAdornment>
            </>
          ),
        },
      }}
    />
  );
}
