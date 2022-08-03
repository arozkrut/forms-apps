import {
  Alert,
  Button, List, ListItem, ListSubheader, Stack,
  Collapse,
  IconButton,
  CircularProgress,
  Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import React, { ReactElement, useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import { LocalizationProvider } from '@mui/x-date-pickers';
import FormList from './components/FormList';
import FormTemplate from './models/FormTemplate';
import CreateDialog from './components/CreateDialog';

function App(): ReactElement {
  const [formTemplates, setFormTemplates] = useState<FormTemplate[]>([]);
  const [openAlert, setOpenAlert] = useState<boolean>(false);
  const [alertText, setAlertText] = useState<string>('');
  const [openCreate, setOpenCreate] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  useEffect(() => {
    setLoading(true);
    const client = axios.create({
      baseURL: 'http://localhost:9090',
    });
    client.get('/forms').then((res) => {
      setFormTemplates(res.data);
      setLoading(false);
    });
  }, []);
  const handleCreate = async (
    text: string,
    startDate: Date | null,
    endDate: Date | null,
  ): Promise<void> => {
    const client = axios.create({
      baseURL: 'http://localhost:9090',
    });

    setLoading(true);
    setOpenCreate(false);

    try {
      const template = JSON.parse(text);
      if (!template.title) {
        setAlertText('Należy podać tytuł');
        setOpenAlert(true);
      } else {
        const res = await client.post('/forms', { title: template.title });
        const id = res.data.formId;
        template.startDate = startDate || template.startDate;
        template.endDate = endDate || template.endDate;
        await client.put(`/forms/${id}`, template);
        const response = await client.get('/forms');
        setFormTemplates(response.data);
      }
      setLoading(false);
    } catch (err) {
      if (typeof err === 'string') {
        setAlertText(err);
      } else if (err instanceof Error) {
        setAlertText(err.message);
      }
      setOpenAlert(true);
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      {!loading && (
        <>
          <List>
            <ListSubheader>
              <Stack direction="row" mt={1} mx={5} spacing={1}>
                <Button variant="contained" onClick={() => setOpenCreate(true)}>
                  Stwórz nowy
                </Button>
                <Button variant="contained">
                  Dodaj istniejący
                </Button>
              </Stack>
            </ListSubheader>
            <ListItem>
              <FormList formTemplates={formTemplates} />
            </ListItem>
          </List>

          <CreateDialog
            open={openCreate}
            handleCreate={handleCreate}
            handleClose={() => setOpenCreate(false)}
          />

          <Collapse in={openAlert}>
            <Alert
              severity="error"
              action={(
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={() => {
                    setOpenAlert(false);
                  }}
                >
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              )}
              sx={{ mb: 2 }}
            >
              {alertText}
            </Alert>
          </Collapse>
        </>
      )}
      {loading && (
        <Box
          sx={{ display: 'flex' }}
          justifyContent="center"
          mt="45%"
        >
          <CircularProgress />
        </Box>
      )}
    </LocalizationProvider>
  );
}

export default App;
