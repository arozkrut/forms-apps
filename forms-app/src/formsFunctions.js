export async function updateFormUsingJsonTemplate(
    forms, id, jsonTemplate, links, formInfo
) {

    if ( jsonTemplate.title != formInfo.info.title ||
        (jsonTemplate.description && 
        jsonTemplate.description != formInfo.info.description) ) {
        await updateFormInfo(
            forms, id, jsonTemplate
        );
    }
    
    if(formInfo.items) {
        await deleteAllFormItems(
            forms, id, formInfo.items.length
        );
    }

    console.log(links);
    
    return await addItemsToForm(
        forms, id, jsonTemplate, links
    );
}
    
async function updateFormInfo(forms, id, jsonTemplate) {
    await forms.forms.batchUpdate({
        formId: id,
        requestBody: {
            includeFormInResponse: false,
            requests: [ {
                updateFormInfo: {
                    info: {
                        title: jsonTemplate.title,
                        description: jsonTemplate.description,
                    },
                    updateMask: "title,description"
                }
            } ],
        }
    });
}
    
export async function deleteAllFormItems(forms, id, items) {
    var requests = [];
    for( var i = items - 1; i >= 0; i--) {
        requests.push({
            deleteItem: {
                location: {
                    index: i
                }
            }
        });
    }
    
    const response = await forms.forms.batchUpdate({
        formId: id,
        requestBody: {
            includeFormInResponse: true,
            requests: requests,
        }
    });
    
    return response.data.revisionId;
}
    
async function addItemsToForm(
    forms, id, jsonTemplate, links
) {
    const choiceQuestion = (q, index, type) => ({
        choiceQuestion: {
            type: type,
            options: q.answers.map((a, position) => ({
                value: a.tex
                    ? `option ${position}`
                    : a.text,
                image: a.tex 
                    ? {
                        sourceUri: links['q' + index + 'a' + position],
                        properties: {
                            alignment: "LEFT"
                        }
                    }
                    : undefined,
                isOther: false
            })),
            shuffle: false
        }
    });
    
    const mapQuestion = (q, index, linkKey) => {
        var question;
        if( q.type === 'checkBox' ) {
            question = choiceQuestion(q, index, "CHECKBOX");
        }
        else if(q.type === 'list') {
            question = choiceQuestion(q, index, "RADIO");
        }
        else if(q.type === 'grid') {
            throw {
                customName: "FailedToParseQuestion",
                message: 
                    "Server failed to parse one of the questions. \
                    Make sure json template has correct schema.",
                status: 500,
            };
        }
        else if(q.type === 'text') {
            question = {
                textQuestion: {
                    paragraph: true,
                }
            };
        }
        else throw {
            customName: "UnknownQuestionType",
            message: "one of the questions in json template \
                has an unknown type",
            status: 400,
        };
    
        return {
            question: question,
            image: q.tex 
                ? {
                    sourceUri: links[linkKey],
                    properties: {
                        alignment: "CENTER"
                    }
                }
                : undefined
        };
    };
    
    const mapItem = (q, index) => {
        return q.type === 'grid'
            ? {
                questionGroupItem: {
                    questions: q.answers.map((a) => 
                        ({
                            rowQuestion: {
                                title: a.text
                            }
                        })
                    ),
                    image: q.tex 
                        ? {
                            sourceUri: links["q" + index],
                            properties: {
                                alignment: "CENTER"
                            }
                        }
                        : undefined,
                    grid: {
                        columns: {
                            type: "RADIO",
                            options: [
                                {
                                    value: "Prawda",
                                    isOther: false,
                                },
                                {
                                    value: "Fałsz",
                                    isOther: false,
                                }
                            ],
                            shuffle: false,
                        },
                        shuffleQuestions: false,
                    }
                },
                description: q.tex
                    ? undefined
                    : q.text
            }
            : {
                questionItem: mapQuestion(q, index, "q" + index),
                description: q.tex
                    ? undefined
                    : q.text
            };
    };
    
    
    var requests = jsonTemplate.questions.map((q, index) => ({
        createItem: {
            item: mapItem(q, index),
            location: {
                index: index
            }
        }})
    );
    
    return await forms.forms.batchUpdate({
        formId: id,
        requestBody: {
            includeFormInResponse: true,
            requests: requests,
        }
    });
}

export async function saveForm(db, form, jsonTemplate) {
    if(!(db&&form&&jsonTemplate)){
        throw {
            customName: "Wrong data",
            message: "Something went wrong. Program received null or undefined",
            status: 500,
        };
    }

    for(let i = 0; i < form.items.length; i++) {
        if(jsonTemplate.questions[i].type === 'grid'){
            for(
                let j = 0;
                j < form.items[i].questionGroupItem.questions.length;
                j++
            ) {
                jsonTemplate.questions[i].answers[j].questionId = 
                    form.items[i].questionGroupItem.questions[j].questionId;
            }
        }
        else {
            jsonTemplate.questions[i].questionId = 
                form.items[i].questionItem.question.questionId;
        }
    }

    db.data.forms[form.formId] = jsonTemplate;
    await db.write();
}

export async function getResponses(forms, id) {
    var answers = [];
    var pageToken;

    var response = await forms.forms.responses.list({
        // Required. ID of the Form whose responses to list.
        formId: id,
    });

    answers = answers.concat(response.data.responses);

    while(response.data.nextPageToken) {
        pageToken = response.data.nextPageToken;

        response = await forms.forms.responses.list({
            // Required. ID of the Form whose responses to list.
            formId: id,
            pageToken: pageToken
        });

        answers = answers.concat(response.data.responses);
    }

    return answers;
}