import React from "react";
import { Formik, Form } from "formik";
import { FormControl, FormLabel, Input, FormHelperText } from "@chakra-ui/core";
import Wrapper from "../components/Wrapper";

interface registerProps {}

export const Register: React.FC<registerProps> = ({}) => {
  return (
    <Wrapper>
      <Formik
        initialValues={{ username: "", password: "" }}
        onSubmit={(values) => {
          console.log(values);
        }}
      >
        {({ values, handleChange }) => (
          <Form>
            <FormControl>
              <FormLabel htmlFor="username">Email address</FormLabel>
              <Input
                id="username"
                placeholder="username"
                value={values.username}
                onChange={handleChange}
              />
              {/* <FormHelperText id="username-helper-text">We'll never share your email.</FormHelperText> */}
            </FormControl>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

export default Register;
