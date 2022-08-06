import {
  Button,
  Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField,
} from '@mui/material';
import React, {
  ChangeEvent, ReactElement, useEffect, useState,
} from 'react';

function CreateDialog(props: {
  open: boolean,
  template: string,
  handleSave:
    (text: string) => void,
  handleClose: () => void
}): ReactElement {
  const {
    open, template, handleSave, handleClose,
  } = props;
  const [text, setText] = useState<string>('');
  useEffect(() => {
    setText(template);
  }, [open, template]);
  const handleChange = (event: ChangeEvent<HTMLInputElement>):void => {
    setText(event.target.value);
  };
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        Edytuj formularz
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <TextField
            multiline
            rows={20}
            style={{ width: '100%' }}
            value={text}
            onChange={handleChange}
            label="Template"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Stack
          direction="row"
          spacing={1}
          mr={2}
          mb={1}
        >
          <Button variant="outlined" onClick={handleClose}>
            Zamknij
          </Button>
          <Button
            variant="outlined"
            onClick={() => handleSave(text)}
          >
            Zapisz
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}

export default CreateDialog;
