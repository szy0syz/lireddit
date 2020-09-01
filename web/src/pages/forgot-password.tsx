import React, { useState } from "react";
import Wrapper from "../components/Wrapper";
import { Formik, Form } from "formik";
import InputField from "../components/InputField";
import { Button, Box } from "@chakra-ui/core";
import { withUrqlClient } from "next-urql";
import { createUrqlClient } from "../utils/createUrqlClient";
import { useForgotPasswordMutation } from "../generated/graphql";

interface ForgotPasswordProps {}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({}) => {
  const [complete, setComplete] = useState(false);
  const [, forgotPassword] = useForgotPasswordMutation();

  return (
    <Wrapper>
      <Formik
        initialValues={{ email: "" }}
        onSubmit={async (values) => {
          await forgotPassword(values);
          setComplete(true);
        }}
      >
        {({ isSubmitting }) =>
          complete ? (
            <Box>if an account with that email exists, we sent you can email</Box>
          ) : (
            <Form>
              <InputField name="email" placeholder="email" label="Email" type="email" />
              <Button mt={4} type="submit" isLoading={isSubmitting} variantColor="teal">
                forgot password
              </Button>
            </Form>
          )
        }
      </Formik>
    </Wrapper>
  );
};

export default withUrqlClient(createUrqlClient)(ForgotPassword);
