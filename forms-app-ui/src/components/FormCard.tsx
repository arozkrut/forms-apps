import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box, Button, Card, CardContent, Typography,
  Stack,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
// eslint-disable-next-line import/no-duplicates
import { format } from 'date-fns';
// eslint-disable-next-line import/no-duplicates
import { pl } from 'date-fns/locale';
import React, {
  Dispatch, ReactElement, SetStateAction, useMemo, useState,
} from 'react';
import { CodeBlock } from 'react-code-blocks';
import FormTemplate from '../models/FormTemplate';

function FormCard(props: {
  form: FormTemplate,
  newEditForm: (
    formTemplate: FormTemplate,
    formattedTemplate: string,
  ) => void,
}): ReactElement {
  const { form, newEditForm } = props;
  const [expandCode, setExpandCode] = useState<boolean>(false);

  const formatedTemplate = useMemo((): string => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const template: any = { ...form };
    template.id = undefined;
    template.responderUri = undefined;
    if (template.questions && template.questions.length) {
      for (let i = 0; i < template.questions.length; i += 1) {
        template.questions[i].questionId = undefined;
        if (template.questions[i].type === 'grid'
          && template.questions[i].answers
          && template.questions[i].answers.length) {
          for (let j = 0; j < template.questions[i].answers.length; j += 1) {
            template.questions[i].answers[j].questionId = undefined;
          }
        }
      }
    }
    return JSON.stringify(template, null, 2);
  }, [form]);

  return (
    <Box>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h5">
            {form.title}
          </Typography>
          {form.description && (
            <Typography variant="body1">
              {form.description}
            </Typography>
          )}
          <Typography variant="body2" mt={2} color="text.secondary">
            {`Rozpoczyna się: ${
              form.startDate
                ? format(new Date(form.startDate), 'PPPP p', { locale: pl })
                : 'nie ustawiono'
            }
            `}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {`Kończy się: ${
              form.endDate
                ? format(new Date(form.endDate), 'PPPP p', { locale: pl })
                : 'nie ustawiono'
            }
            `}
          </Typography>
        </CardContent>
        <Stack direction="row" spacing={1} mx={2} mb={2}>
          <Button
            variant="outlined"
            onClick={
              () => window.open(
                form.responderUri,
                '_blank',
                'noopener,noreferrer',
              )
            }
          >
            Otwórz formularz Google
          </Button>
          <Button
            variant="outlined"
            onClick={
              () => newEditForm(form, formatedTemplate)
            }
          >
            Edytuj
          </Button>
          <Button
            variant="outlined"
            onClick={
              () => console.log('usuń')
            }
          >
            Usuń
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={
              () => console.log('odpowiedzi')
            }
          >
            Pobierz odpowiedzi
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={
              () => console.log('odpowiedzi')
            }
          >
            Pobierz oceny
          </Button>
        </Stack>
        <Accordion
          expanded={expandCode}
          onChange={() => { setExpandCode(!expandCode); }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1bh-content"
            id="panel1bh-header"
          >
            <Typography>
              Rozwiń template formularza
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <CodeBlock
              text={formatedTemplate}
              language="json"
            />
          </AccordionDetails>
        </Accordion>
      </Card>
    </Box>
  );
}
export default FormCard;
