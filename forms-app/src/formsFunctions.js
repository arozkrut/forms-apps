module.exports = {
    updateFormUsingJsonTemplate: async function (
        forms, id, jsonTemplate, links, formInfo
    ) {

        if ( jsonTemplate.title != formInfo.info.title ) {
            await this.updateTitle(
                forms, id, jsonTemplate.title, formInfo.revisionId
            );
        }
      
        var newRevisionId = formInfo.revisionId;
        if(formInfo.items) {
            newRevisionId = await this.deleteAllFormItems(
                forms, id, formInfo.items.length, formInfo.revisionId
            );
        }

        console.log(links);
       
        await this.addItemsToForm(
            forms, id, jsonTemplate, links, newRevisionId
        );
    },
      
    updateTitle: async function (forms, id, title, revisionId) {
        console.log("title:" +  title); // TODO: delete this

        await forms.forms.batchUpdate({
            formId: id,
            requestBody: {
                includeFormInResponse: false,
                requests: [ {
                    updateFormInfo: {
                        info: {
                            title: title
                        },
                        updateMask: "title"
                    }
                } ],
                writeControl: {
                    requiredRevisionId: revisionId
                }
            }
        });
    },
      
    deleteAllFormItems: async function (forms, id, items, revisionId) {
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
                writeControl: {
                    targetRevisionId: revisionId
                }
            }
        });
      
        return response.data.revisionId;
    },
      
    addItemsToForm: async function (
        forms, id, jsonTemplate, links, newRevisionId
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
      
        await forms.forms.batchUpdate({
            formId: id,
            requestBody: {
                includeFormInResponse: false,
                requests: requests,
                writeControl: {
                    targetRevisionId: newRevisionId
                }
            }
        });
    }
};