import {
  Button,
  Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField,
  Alert,
  Typography,
  Grid,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import React, {
  ChangeEvent, ReactElement, useEffect, useState,
} from 'react';

function CreateDialog(props: {
  open: boolean,
  handleCreate:
    (text: string, startDate: Date | null, endDate: Date | null) => void,
  handleClose: () => void
}): ReactElement {
  const { open, handleCreate, handleClose } = props;
  const [text, setText] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  useEffect(() => {
    setText('');
    setStartDate(null);
    setEndDate(null);
  }, [open]);
  const handleChange = (event: ChangeEvent<HTMLInputElement>):void => {
    setText(event.target.value);
  };
  const handleStartDateChange = (newValue: Date | null): void => {
    setStartDate(newValue);
  };
  const handleEndDateChange = (newValue: Date | null): void => {
    setEndDate(newValue);
  };
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        Stwórz nowy formularz
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Alert severity="info">
            <Typography variant="body1">
              Można ręcznie wybrać datę rozpoczęcia i zakończenia
              lub wprowadzić ISO string w template formularza.
            </Typography>
          </Alert>
          <Grid container>
            <Grid item xs={6} pr={1}>
              <DateTimePicker
                label="Czas rozpoczęcia"
                value={startDate}
                onChange={handleStartDateChange}
                renderInput={(params) => (
                // eslint-disable-next-line react/jsx-props-no-spreading
                  <TextField {...params} style={{ width: '100%' }} />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <DateTimePicker
                label="Czas zakończenia"
                value={endDate}
                onChange={handleEndDateChange}
                // eslint-disable-next-line react/jsx-props-no-spreading
                renderInput={(params) => (
                // eslint-disable-next-line react/jsx-props-no-spreading
                  <TextField {...params} style={{ width: '100%' }} />
                )}
              />
            </Grid>
          </Grid>
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
            onClick={() => handleCreate(text, startDate, endDate)}
          >
            Stwórz
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}

export default CreateDialog;
