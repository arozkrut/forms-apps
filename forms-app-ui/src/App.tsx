// This application was created using Create React App.
// Create React App is licensed under MIT License

// Copyright (c) 2013-present, Facebook, Inc.

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

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
import AddDialog from './components/AddDialog';
import EditDialog from './components/EditDialog';

function App(): ReactElement {
  const SERVER_BASE_URL = 'http://localhost:9090';
  const [formTemplates, setFormTemplates] = useState<FormTemplate[]>([]);
  const [openAlert, setOpenAlert] = useState<boolean>(false);
  const [alertText, setAlertText] = useState<string>('');
  const [openCreate, setOpenCreate] = useState<boolean>(false);
  const [openAdd, setOpenAdd] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [editingForm, setEditingForm] = useState<FormTemplate | null>(null);
  const [
    formattedEditingForm, setFormattedEditingForm,
  ] = useState<string | null>(null);
  useEffect(() => {
    setLoading(true);
    const client = axios.create({
      baseURL: SERVER_BASE_URL,
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
      baseURL: SERVER_BASE_URL,
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

  const handleAdd = async (
    text: string,
    id: string,
    startDate: Date | null,
    endDate: Date | null,
  ): Promise<void> => {
    const client = axios.create({
      baseURL: SERVER_BASE_URL,
    });

    setLoading(true);
    setOpenAdd(false);

    try {
      const template = JSON.parse(text);
      if (!template.title) {
        setAlertText('Należy podać tytuł');
        setOpenAlert(true);
      } else if (!id) {
        setAlertText('Należy podać ID');
        setOpenAlert(true);
      } else {
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

  const handleSave = async (text: string): Promise<void> => {
    const client = axios.create({
      baseURL: SERVER_BASE_URL,
    });

    setLoading(true);

    try {
      const template = JSON.parse(text);
      if (!template.title) {
        setAlertText('Należy podać tytuł');
        setOpenAlert(true);
      } else if (editingForm) {
        await client.put(`/forms/${editingForm.id}`, template);
        const response = await client.get('/forms');
        setFormTemplates(response.data);
      }
    } catch (err) {
      if (typeof err === 'string') {
        setAlertText(err);
      } else if (err instanceof Error) {
        setAlertText(err.message);
      }
      setOpenAlert(true);
    }
    setEditingForm(null);
    setFormattedEditingForm('');
    setLoading(false);
  };

  const handleDelete = async (id: string): Promise<void> => {
    const client = axios.create({
      baseURL: SERVER_BASE_URL,
    });

    setLoading(true);

    try {
      if (id) {
        await client.delete(`/forms/${id}`);
        const response = await client.get('/forms');
        setFormTemplates(response.data);
      }
    } catch (err) {
      if (typeof err === 'string') {
        setAlertText(err);
      } else if (err instanceof Error) {
        setAlertText(err.message);
      }
      setOpenAlert(true);
    }
    setLoading(false);
  };

  const newEditForm = (
    formTemplate: FormTemplate,
    formattedTemplate: string,
  ):void => {
    setEditingForm(formTemplate);
    setFormattedEditingForm(formattedTemplate);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      {!loading && (
        <>
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
            >
              {alertText}
            </Alert>
          </Collapse>

          <List>
            <ListSubheader>
              <Stack direction="row" mt={1} mx={5} spacing={1}>
                <Button variant="contained" onClick={() => setOpenCreate(true)}>
                  Stwórz nowy
                </Button>
                <Button variant="contained" onClick={() => setOpenAdd(true)}>
                  Dodaj istniejący
                </Button>
              </Stack>
            </ListSubheader>
            <ListItem>
              <FormList
                formTemplates={formTemplates}
                newEditForm={newEditForm}
                handleDelete={handleDelete}
              />
            </ListItem>
          </List>

          <CreateDialog
            open={openCreate}
            handleCreate={handleCreate}
            handleClose={() => setOpenCreate(false)}
          />

          <AddDialog
            open={openAdd}
            handleAdd={handleAdd}
            handleClose={() => setOpenAdd(false)}
          />

          <EditDialog
            open={editingForm !== null}
            handleSave={handleSave}
            handleClose={() => setEditingForm(null)}
            template={formattedEditingForm || ''}
          />
        </>
      )}
      {loading && (
        <Box
          sx={{ display: 'flex' }}
          justifyContent="center"
          mt="45vh"
        >
          <CircularProgress />
        </Box>
      )}
    </LocalizationProvider>
  );
}

export default App;
