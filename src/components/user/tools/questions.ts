import { sendQuery } from "../../../common-tools/database-tools/database-manager";
import { QUESTIONS } from "../../../configurations";
import { AnswerIds, Question, QuestionAnswer, User } from "../../../shared-tools/endpoints-interfaces/user";
import { queryToRelateUserWithTag } from "../../tags/queries";

/**
 * This is the same than QUESTIONS const but without the props that should not be sent to the client
 */
export const QUESTIONS_FOR_CLIENT: Question[] = QUESTIONS.map(q => {
   const newQ = { ...q };
   newQ.answers = newQ.answers.map(a => {
      const newA = { ...a };
      delete newA.subscribesToTags;
      delete newA.blocksTags;
      delete newA.setsUserProp;
      return newA;
   });
   return newQ;
});

/**
 * With a list of question answers this function applies the question by making the required tag changes to the user
 * and then returns some user props that needs to be updated.
 */
export async function applyQuestionResponses(params: {
   token: string;
   questionsResponded?: AnswerIds[];
   answers: AnswerIds[];
}) {
   const { token, questionsResponded, answers = [] } = params;

   const answersToCompute = [...answers];
   let newUserProps: Partial<User> = {};

   for (const answerInParams of answersToCompute) {
      const { questionId, answerId } = answerInParams;
      const question = QUESTIONS.find(q => q.questionId === questionId);
      const answer = question.answers.find(a => a.answerId === answerId);
      const notSelectedAnswers = question.answers.filter(a => a.answerId !== answerId);
      const userPropsFromAnswer = getUserPropsFromAnswer(answer);

      /**
       * Set the user props of the answer if any.
       * We don't need to update the profileCompleted prop because we are calling userPost again later
       */
      if (userPropsFromAnswer) {
         newUserProps = { ...newUserProps, ...userPropsFromAnswer };
      }

      /**
       * In case the user selected other answers of this same question in the past, we need to undo the other answers actions.
       */
      const tagsToUnsubscribe: string[] = [];
      const tagsToUnblock: string[] = [];
      for (const notSelectedAnswer of notSelectedAnswers) {
         notSelectedAnswer.subscribesToTags?.forEach(tag => {
            tagsToUnsubscribe.push(tag.tagId);
         });
         notSelectedAnswer.blocksTags?.forEach(tag => {
            tagsToUnblock.push(tag.tagId);
         });
      }
      if (tagsToUnsubscribe.length > 0) {
         await sendQuery(() =>
            queryToRelateUserWithTag({
               token,
               tagIds: tagsToUnsubscribe,
               relation: "subscribed",
               remove: true,
            }).iterate(),
         );
      }
      if (tagsToUnblock.length > 0) {
         await sendQuery(() =>
            queryToRelateUserWithTag({
               token,
               tagIds: tagsToUnblock,
               relation: "blocked",
               remove: true,
            }).iterate(),
         );
      }

      /**
       * Now we apply the tag subscription and blocking of the answer selected.
       */
      const tagsToSubscribe: string[] = [];
      const tagsToBlock: string[] = [];
      answer.subscribesToTags?.forEach(tag => {
         tagsToSubscribe.push(tag.tagId);
      });
      answer.blocksTags?.forEach(tag => {
         tagsToBlock.push(tag.tagId);
      });
      if (tagsToSubscribe.length > 0) {
         await sendQuery(() =>
            queryToRelateUserWithTag({
               token,
               tagIds: tagsToSubscribe,
               relation: "subscribed",
               remove: false,
            }).iterate(),
         );
      }
      if (tagsToBlock.length > 0) {
         await sendQuery(() =>
            queryToRelateUserWithTag({
               token,
               tagIds: tagsToBlock,
               relation: "blocked",
               remove: false,
            }).iterate(),
         );
      }

      /**
       * If the question answers other questions we add it to this same loop, we extends this loop
       */
      if (answer.answersOtherQuestions?.length > 0) {
         answer.answersOtherQuestions.forEach(a => {
            // Add it only if it does not have it already
            if (!answersToCompute.find(toAdd => toAdd.questionId === a.questionId)) {
               answersToCompute.push(a);
            }
         });
      }
   }

   /**
    * Update the questionsShowed prop
    */
   newUserProps = {
      ...newUserProps,
      questionsResponded: getQuestionsResponded({
         previousAnswers: questionsResponded,
         newAnswers: answersToCompute,
      }),
   };

   return newUserProps;
}

/**
 * Some answers writes props to the user, this returns the user object with the required props to update (if any).
 */
function getUserPropsFromAnswer(answer: QuestionAnswer): Partial<User> {
   if (answer.setsUserProp == null || answer.setsUserProp.length === 0) {
      return;
   }

   const props = {};
   answer.setsUserProp.forEach(propToChange => {
      if (typeof propToChange.valueToSet !== "function") {
         props[propToChange.propName] = propToChange.valueToSet;
      } else {
         props[propToChange.propName] = propToChange.valueToSet();
      }
   });

   return props;
}

/**
 * We need this code to know which questions were answered because sometimes one answer changes and the other
 * answers of that question were automatically responding other questions, when changing the answer more questions
 * may be needed to be asked again, so it's not so simple as just adding the received answers as responded.
 * The response of this function should be the new value of "questionsShowed" user prop.
 *
 * @param computedAnswers The answers received in the request that were computed (tags relationship and user props done)
 * @param questionsResponded The questions previously showed (the current ) received in the request that were computed (tags relationship and user props done)
 */
function getQuestionsResponded(props: { previousAnswers: AnswerIds[]; newAnswers: AnswerIds[] }) {
   const { previousAnswers, newAnswers } = props;
   let result: AnswerIds[] = [];
   let questionsToAskAgain: AnswerIds[] = [];

   if (newAnswers == null || newAnswers.length === 0) {
      return previousAnswers;
   }

   newAnswers.forEach(answer => {
      result.push(answer);
      questionsToAskAgain.push(...getOtherAnswersTree(answer));
   });

   const resultAsSet = new Set(result.map(answer => answer.questionId));

   // We need to keep the previous answers in the result to not lose them, but only the questions that are not being responded in the new answers
   previousAnswers?.forEach(answer => {
      if (!resultAsSet.has(answer.questionId)) {
         result.push(answer);
      }
   });

   /**
    * The request may contain the answers already because the frontend already knows these questions become
    * required and sends all in the request, so we remove from questionsToAskAgain the ones that come in the
    * same request.
    */
   questionsToAskAgain = questionsToAskAgain.filter(q => !newAnswers.find(a => a.questionId === q.questionId));

   // Here we remove the questions to ask again from the list of questions answered
   questionsToAskAgain.forEach(askAgain => {
      result = result.filter(resultItem => resultItem.questionId !== askAgain.questionId);
   });

   return result;
}

/**
 * When one question answers others (has the answerOtherQuestion prop) then we have what we are calling "answer tree".
 * If the user changes the response the other questions that were previously "auto answered" now needs to be asked.
 * This function returns an array with the questions that needs to be asked again, the idea is to remove them from
 * the already responded questions in user's "questionsShowed" prop and the profile becomes incomplete.
 */
function getOtherAnswersTree(selectedAnswer: AnswerIds) {
   const { questionId, answerId } = selectedAnswer;
   const question = QUESTIONS.find(q => q.questionId === questionId);
   // The answer note selected from the current question are the ones that contains the tree we need to invalidate
   const notSelectedAnswers = question.answers.filter(a => a.answerId !== answerId);

   const result: AnswerIds[] = notSelectedAnswers
      .filter(a => a.answersOtherQuestions?.length > 0)
      .map(a => a.answersOtherQuestions)
      .flat();
   const resultSet = new Set<AnswerIds>(result);

   for (const questionFromTree of result) {
      const moreQuestionsFromTree = QUESTIONS.find(q => q.questionId === questionFromTree.questionId)
         .answers.filter(a => a.answersOtherQuestions?.length > 0)
         .map(a => a.answersOtherQuestions)
         .flat();

      moreQuestionsFromTree.forEach(q => {
         if (!resultSet.has(q)) {
            resultSet.add(q);
            // This adds the new element to this same loop, enlarges the loop so it's similar to a recursion or while
            result.push(q);
         }
      });
   }

   return result;
}
