import React, { useState, useEffect } from 'react'
import { API_BASE_URL } from './config'
import { Button, Card, Input, FileInput } from './components'
import { ethers } from 'ethers'

// Contract configuration
const CONTRACT_ADDRESS = '0x121B48de8BE585ffe1a7B4f5A7dfe24bc792A34f';
const CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "receiverHash",
        "type": "bytes32"
      },
      {
        "internalType": "bytes32",
        "name": "docHash",
        "type": "bytes32"
      }
    ],
    "name": "storeDocument",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

export default function Sender() {
  const [file, setFile] = useState(null)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [result, setResult] = useState(null)
  const [walletAddress, setWalletAddress] = useState('')
  const [isConnected, setIsConnected] = useState(false)

  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
        setWalletAddress(accounts[0]);
        setIsConnected(true);
        setMessage('Wallet connected successfully!');
      } else {
        setMessage('Please install MetaMask to use this feature');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setMessage('Failed to connect wallet');
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setResult(null)
    if (!file) { setMessage('Pick a file first'); return }
    if (!email) { setMessage('Provide receiver email'); return }
    if (!isConnected) { setMessage('Please connect your wallet first'); return }
    
    try {
      setLoading(true)
      
      // Calculate document hash
      const fileBuffer = await file.arrayBuffer()
      const docHashHex = ethers.keccak256(new Uint8Array(fileBuffer))
      const receiverHashHex = ethers.keccak256(ethers.toUtf8Bytes(email.toLowerCase()))
      
      // Connect to MetaMask and get provider
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
      
      // This will trigger MetaMask confirmation popup
      setMessage('Please confirm the transaction in MetaMask...')
      const tx = await contract.storeDocument(receiverHashHex, docHashHex)
      
      setMessage('Transaction submitted! Waiting for confirmation...')
      await tx.wait()
      
      setMessage('Blockchain transaction confirmed! Sending document...')
      
      // Now send the document to server
      const fd = new FormData()
      fd.append('file', file)
      fd.append('toEmail', email)
      fd.append('walletAddress', walletAddress)
      fd.append('docHashHex', docHashHex)
      fd.append('receiverHashHex', receiverHashHex)

      const resp = await fetch(`${API_BASE_URL}/api/send`, { 
        method: 'POST', 
        body: fd,
      })
      const data = await resp.json()
      if (!data.success) throw new Error(data.error || 'Failed')
      
      console.log('Upload response:', data)
      setResult(data)
      setMessage('Email sent! Steganographic images delivered. Blockchain transaction confirmed.')
      
    } catch (err) {
      console.error('Transaction error:', err)
      if (err.code === 4001) {
        setMessage('Transaction rejected by user')
      } else if (err.code === -32603) {
        setMessage('Transaction failed. Please check your wallet balance and try again.')
      } else {
        setMessage(err.message || 'Transaction failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ 
          color: '#2c3e50',
          marginBottom: '12px'
        }}>Send Secure Documents</h2>
        <p style={{ 
          color: '#6c757d',
          lineHeight: '1.5'
        }}>
          Upload a document and send two steganographic images to the receiver's email. 
          The document hash is recorded on-chain for integrity verification.
        </p>
      </div>

      <Card>
        {!isConnected && (
          <Button
            onClick={connectWallet}
            primary
            style={{ marginBottom: '20px' }}
          >
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
              <span role="img" aria-label="wallet">👛</span>
              <span>Connect Wallet</span>
            </div>
          </Button>
        )}
        {isConnected && (
          <div style={{
            marginBottom: '20px',
            padding: '8px',
            backgroundColor: '#e8f4ff',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span role="img" aria-label="wallet">👛</span>
            <span style={{color: '#0056b3'}}>Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
          </div>
        )}
        <form onSubmit={onSubmit} style={{display:'grid', gap:20}}>
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#495057',
              fontWeight: '500'
            }}>
              Document
            </label>
            <FileInput onChange={e => setFile(e.target.files?.[0])} />
            {file && (
              <div style={{
                marginTop: '8px',
                padding: '8px',
                backgroundColor: '#e8f4ff',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span role="img" aria-label="file">📄</span>
                <span style={{color: '#0056b3'}}>{file.name}</span>
                <Button 
                  style={{marginLeft: 'auto', padding: '4px 8px'}}
                  onClick={() => setFile(null)}
                >
                  ✕
                </Button>
              </div>
            )}
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#495057',
              fontWeight: '500'
            }}>
              Receiver's Email
            </label>
            <Input
              type="email"
              placeholder="Enter receiver's email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            primary
            disabled={loading || !file || !email}
            style={{marginTop: '8px'}}
          >
            {loading ? (
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}>
                <span>Sending...</span>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid #ffffff',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}></div>
              </div>
            ) : (
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <span role="img" aria-label="send">📤</span>
                <span>Upload & Send</span>
              </div>
            )}
          </Button>
        </form>
      </Card>

      {message && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          borderRadius: '6px',
          backgroundColor: message.includes('sent') ? '#d4edda' : '#f8d7da',
          color: message.includes('sent') ? '#155724' : '#721c24',
          border: `1px solid ${message.includes('sent') ? '#c3e6cb' : '#f5c6cb'}`,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span role="img" aria-label={message.includes('sent') ? 'success' : 'error'}>
            {message.includes('sent') ? '✅' : '⚠️'}
          </span>
          {message}
        </div>
      )}

      {result && (
        <Card style={{marginTop: '16px'}}>
          <h3 style={{margin: '0 0 16px 0', color: '#2c3e50'}}>Transaction Details</h3>
          <div style={{
            display: 'grid',
            gap: '12px',
            fontSize: '14px',
            color: '#495057'
          }}>
            <div style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center'
            }}>
              <strong>File ID:</strong>
              <code style={{
                backgroundColor: '#f8f9fa',
                padding: '2px 6px',
                borderRadius: '4px'
              }}>{result.fileId}</code>
            </div>
            <div style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center'
            }}>
              <strong>Email ID:</strong>
              <code style={{
                backgroundColor: '#f8f9fa',
                padding: '2px 6px',
                borderRadius: '4px'
              }}>{result.emailId}</code>
            </div>
            <div style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center'
            }}>
              <strong>Document Hash:</strong>
              <code style={{
                backgroundColor: '#f8f9fa',
                padding: '2px 6px',
                borderRadius: '4px',
                wordBreak: 'break-all'
              }}>{result.docHashHex}</code>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
