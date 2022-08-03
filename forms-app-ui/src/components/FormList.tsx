import React, { ReactElement } from 'react';
import { Container, Stack } from '@mui/material';
import FormTemplate from '../models/FormTemplate';
import FormCard from './FormCard';

function FormList(props: {formTemplates: FormTemplate[]}): ReactElement {
  const { formTemplates } = props;
  return (
    <Container>
      <Stack spacing={2} m={1}>
        {formTemplates.map((form) => (
          <FormCard form={form} key={form.id} />
        ))}
      </Stack>
    </Container>
  );
}
export default FormList;
