import React, { Component, type ErrorInfo, type ReactNode } from 'react'
import logo from '../../assets/logo.svg'
import wrong from '../../assets/wrong.svg'
import { Button, Flex, Space, Typography } from 'antd'
import './index.scss'
import { WarningFilled, WarningOutlined } from '@ant-design/icons'
import { sendMessage } from '../../common/helpers'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

const { Title, Text } = Typography

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('React Error Boundary:', error)
    console.error('Component stack:', errorInfo.componentStack)

    // Later you could send this to your backend/error tracking service.
    // reportError(error, errorInfo);
  }

  handleReload = () => {
    // Remove all the chrome local storage state
    // That ends up unauthorizing the user
    sendMessage({ type: 'CLEAR_STATE' })
    this.setState({
      hasError: false,
      error: null,
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <Flex className="error-boundary" vertical>
          <header className="popup-header">
            <Space className="popup-left">
              <img className="brand-logo" src={logo} alt="" />
              <Title className="primary" level={2}>
                Tango
              </Title>
            </Space>
          </header>
          <Flex vertical className="error-boundary-body" justify="center">
            <img src={wrong} alt="" />
            <Text>Encountered an unexpected error. Try logging back out to fix the error. </Text>
            <Button type="primary" onClick={this.handleReload} danger>
              <WarningFilled />
              Logout
            </Button>
          </Flex>
          {/* {import.meta.env.DEV && this.state.error && <pre>{this.state.error.message}</pre>} */}
        </Flex>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
