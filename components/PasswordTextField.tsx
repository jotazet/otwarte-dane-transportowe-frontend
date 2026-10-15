"use client";

import * as React from "react";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField, { type TextFieldProps } from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";

type PasswordTextFieldProps = TextFieldProps & {
  showPasswordLabel: string;
  hidePasswordLabel: string;
};

export function PasswordTextField({
  showPasswordLabel,
  hidePasswordLabel,
  slotProps,
  ...props
}: PasswordTextFieldProps) {
  const [show, setShow] = React.useState(false);
  const inputSlot = slotProps?.input;
  const inputProps = typeof inputSlot === "object" && inputSlot != null ? inputSlot : {};
  const existingEndAdornment = "endAdornment" in inputProps ? inputProps.endAdornment : undefined;
  const toggleLabel = show ? hidePasswordLabel : showPasswordLabel;

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
                <Tooltip title={toggleLabel}>
                  <IconButton
                    type="button"
                    onClick={() => setShow((v) => !v)}
                    edge="end"
                    aria-label={toggleLabel}
                    size="small"
                  >
                    {show ? (
                      <MdVisibilityOff size={22} aria-hidden />
                    ) : (
                      <MdVisibility size={22} aria-hidden />
                    )}
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            </>
          ),
        },
      }}
    />
  );
}
