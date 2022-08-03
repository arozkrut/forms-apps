import React, { Dispatch, ReactElement, SetStateAction } from 'react';
import { Container, Stack } from '@mui/material';
import FormTemplate from '../models/FormTemplate';
import FormCard from './FormCard';

function FormList(props: {
  formTemplates: FormTemplate[],
  newEditForm: (
    formTemplate: FormTemplate,
    formattedTemplate: string,
  ) => void,
}): ReactElement {
  const { formTemplates, newEditForm } = props;
  return (
    <Container>
      <Stack spacing={2} m={1}>
        {formTemplates.map((form) => (
          <FormCard form={form} key={form.id} newEditForm={newEditForm} />
        ))}
      </Stack>
    </Container>
  );
}
export default FormList;
