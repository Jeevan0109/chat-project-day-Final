import React, { Fragment, useEffect, useState } from "react";
import { Col, Row, Form } from "react-bootstrap";
import { gql, useQuery, useLazyQuery, useMutation } from "@apollo/client";
import { useMessagesDispatch, useMessagesState } from "../../context/message";
import Message from "../Home/Message";
import { from } from "zen-observable";

const GET_MESSAGES = gql`
  query getUsers($from: String!) {
    getMessages(from: $from) {
      uuid
      from
      to
      content
      createdAt
    }
  }
`;

const SEND_MESSAGE = gql`
  mutation sendMessage($to: String!, $content: String!) {
    sendMessage(to: $to, content: $content) {
      uuid
      from
      to
      content
      createdAt
    }
  }
`;

export default function Messages() {
  const { users } = useMessagesState();
  const dispatch = useMessagesDispatch();

  const [content, setContent] = useState("");

  const selectedUser = users?.find((u) => u.selected === true);
  const messages = selectedUser?.messages;

  const [getMessages, { loading: messagingLoading, data: messagesData }] =
    useLazyQuery(GET_MESSAGES);

  const [sendMessage] = useMutation(SEND_MESSAGE, {
    onCompleted: (data) =>
      dispatch({
        type: "ADD_MESSAGE",
        payload: {
          username: selectedUser.username,
          message: data.sendMessage,
        },
      }),
    onError: (err) => console.log(err),
  });

  useEffect(() => {
    if (selectedUser && !selectedUser.messages) {
      getMessages({ variables: { from: selectedUser.username } });
    }
  }, [selectedUser]);

  useEffect(() => {
    if (messagesData) {
      dispatch({
        type: "SET_USER_MESSAGES",
        payload: {
          username: selectedUser.username,
          messages: messagesData.getMessages,
        },
      });
    }
  }, [messagesData]);

  const submitMessage = (e) => {
    e.preventDefault(); //page reload
    if (content === "") return;

    //mutation for sending the message

    sendMessage({ variables: { to: selectedUser.username, content } });
  };

  let selectedChatMarkup;
  if (!messages && !messagingLoading) {
    selectedChatMarkup = <p>Select a friend</p>;
  } else if (messagingLoading) {
    selectedChatMarkup = <p>Loading...</p>;
  } else if (messages.length > 0) {
    selectedChatMarkup = messages.map((message, index) => (
      <Fragment key={message.uuid}>
        <Message message={message} />
        {index === messages.length - 1 && (
          <div className="invisible">
            <hr className="m-0" />
          </div>
        )}
      </Fragment>
    ));
  } else if (messages.length === 0) {
    selectedChatMarkup = <p>You are now connected! send your first message!</p>;
  }

  return (
    <Col xs={10} md={8}>
      <div className="message-box d-flex flex-column-reverse">
        {selectedChatMarkup}
      </div>
      <div>
        <Form onSubmit={submitMessage}>
          <Form.Group>
            <Form.Control
              text="text"
              className="rounded-pill bg-secondary"
              placeholder="type a message.."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </Form.Group>
        </Form>
      </div>
    </Col>
  );
}
