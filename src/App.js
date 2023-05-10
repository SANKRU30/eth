import {Table, Row, Button, Form, Container } from 'react-bootstrap';
import React, { Component } from 'react';
//import logo from './logo.svg';
import './App.css';
import web3 from './web3';
import { Buffer } from 'buffer';
import ipfs from './ipfs';
import storehash from './storehash';

class App extends Component {
 
    state = {
      ipfsHash: null,
      buffer: '',
      ethAddress: '',
      blockNumber: '',
      transactionHash: '',
      gasUsed: '',
      txReceipt: ''   
    };
   
    captureFile = (event) => {
      event.stopPropagation();
      event.preventDefault();
      const file = event.target.files[0];
      let reader = new window.FileReader();
      reader.readAsArrayBuffer(file);
      reader.onloadend = () => this.convertToBuffer(reader);    
    };

    convertToBuffer = async (reader) => {
      //file is converted to a buffer to prepare for uploading to IPFS
      const buffer = await Buffer.from(reader.result);
      //set this buffer -using es6 syntax
      this.setState({ buffer });
    };

    onClick = async () => {
      try {
        this.setState({ blockNumber: "waiting.." });
        this.setState({ gasUsed: "waiting..." });

        // get Transaction Receipt in console on click
        // See: https://web3js.readthedocs.io/en/1.0/web3-eth.html#gettransactionreceipt
        const txReceipt = await web3.eth.getTransactionReceipt(this.state.transactionHash);
        console.log(txReceipt);
        this.setState({ txReceipt });

        await this.setState({ blockNumber: txReceipt.blockNumber });
        await this.setState({ gasUsed: txReceipt.gasUsed });    
      } catch(error) {
        console.log(error);
      }
    };

    onSubmit = async (event) => {
      event.preventDefault();

      //bring in user's metamask account address
      const accounts = await web3.eth.getAccounts();
      console.log('Sending from Metamask account: ' + accounts[0]);

      //obtain contract address from storehash.js
      const ethAddress = storehash.options.address;
      this.setState({ ethAddress });

      //save document to IPFS,return its hash#, and set hash# to state
      //https://github.com/ipfs/interface-ipfs-core/blob/master/SPEC/FILES.md#add 
      await ipfs.add(this.state.buffer, async (err, ipfsHash) => {
        console.log(err, ipfsHash);
        //setState by setting ipfsHash to ipfsHash[0].hash 
        await this.setState({ ipfsHash: ipfsHash[0].hash });

        // call Ethereum contract method "sendHash" and .send IPFS hash to etheruem contract 
        //return the transaction hash from the ethereum contract
        //see, this https://web3js.readthedocs.io/en/1.0/web3-eth-contract.html#methods-mymethod-send
        
        storehash.methods.sendHash(this.state.ipfsHash).send({
          from: accounts[0] 
        }, (error, transactionHash) => {
          console.log(transactionHash);
          this.setState({ transactionHash });
        }); //store
      });
    };

    render() {      
      return (
        <div className="App">
          <header className="App-header">
            <h1> Ethereum and InterPlanetary File System(IPFS) with Create React App</h1>
          </header>
          
          <hr />

          <Container>
            <h3> Choose file to send to IPFS </h3>
            <Form onSubmit={this.onSubmit}>
              <input
              type = "file"
              onChange = {this.captureFile}
            />
             <Button 
             bsStyle="primary" 
             type="submit"> 
             Send it 
             </Button>
          </Form>

          <hr/>
            <Button onClick = {this.onClick}> Get Transaction Receipt </Button>

              <Table bordered responsive>
                <thead>
                  <tr>
                    <th>Tx Receipt Category</th>
                    <th>Values</th>
                  </tr>
                </thead>
               
                <tbody>
                  <tr>
                    <td>IPFS Hash # stored on Eth Contract</td>
                    <td>{this.state.ipfsHash}</td>
                  </tr>
                  <tr>
                    <td>Ethereum Contract Address</td>
                    <td>{this.state.ethAddress}</td>
                  </tr>

                  <tr>
                    <td>Tx Hash # </td>
                    <td>{this.state.transactionHash}</td>
                  </tr>

                  <tr>
                    <td>Block Number # </td>
                    <td>{this.state.blockNumber}</td>
                  </tr>

                  <tr>
                    <td>Gas Used</td>
                    <td>{this.state.gasUsed}</td>
                  </tr>                
                </tbody>
            </Table>
        </Container>
     </div>
      );
    } //render
}

export default App;
