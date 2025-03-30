import { useEffect, useState } from 'react';
import { Button, Form } from 'react-bootstrap';

const Register = ({mediChain, connectWallet, token, account, setToken, setAccount}) => {
    const [designation, setDesignation] = useState("1");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [age, setAge] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const checkMetaMaskConnection = async () => {
        // Kiểm tra MetaMask đã được cài đặt chưa
        if (typeof window.ethereum === 'undefined') {
            alert('Vui lòng cài đặt MetaMask để tiếp tục!');
            return false;
        }

        // Kiểm tra đã kết nối MetaMask chưa
        if (!account) {
            alert('Vui lòng kết nối ví MetaMask trước khi đăng ký!');
            return false;
        }

        try {
            // Kiểm tra network hiện tại
            const networkId = await window.ethereum.request({ method: 'net_version' });
            // Thay đổi networkId tùy theo mạng bạn đang sử dụng
            // 1: Mainnet, 3: Ropsten, 4: Rinkeby, 5: Goerli, 42: Kovan
            // Nếu dùng Ganache local thì networkId thường là 5777
            if (networkId !== '5777') { // Thay đổi ID này theo mạng bạn sử dụng
                alert('Vui lòng chuyển sang mạng Ganache local!');
                return false;
            }

            // Kiểm tra số dư
            const balance = await window.ethereum.request({
                method: 'eth_getBalance',
                params: [account, 'latest']
            });
            
            if (parseInt(balance, 16) === 0) {
                alert('Số dư trong ví không đủ để thực hiện giao dịch!');
                return false;
            }

            return true;
        } catch (error) {
            console.error('Lỗi khi kiểm tra MetaMask:', error);
            alert('Có lỗi xảy ra khi kiểm tra kết nối MetaMask!');
            return false;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Kiểm tra MetaMask trước khi thực hiện đăng ký
            const isMetaMaskReady = await checkMetaMaskConnection();
            if (!isMetaMaskReady) {
                setIsLoading(false);
                return;
            }

            // Kiểm tra tuổi khi đăng ký bệnh nhân
            if (designation === "1" && (!age || parseInt(age) <= 0)) {
                alert("Tuổi phải lớn hơn 0 khi đăng ký bệnh nhân");
                setIsLoading(false);
                return;
            }

            // Tạo hash record mặc định cho bệnh nhân
            const defaultHash = designation === "1" ? JSON.stringify({
                medicalHistory: [],
                allergies: [],
                medications: [],
                lastUpdated: new Date().toISOString()
            }) : "";

            // Thực hiện đăng ký
            await mediChain.methods.register(
                name, 
                parseInt(age) || 0, 
                parseInt(designation), 
                email, 
                defaultHash
            ).send({
                from: account,
                gas: 3000000 // Đặt gas limit cụ thể
            }).on('transactionHash', async (hash) => {
                console.log('Transaction hash:', hash);
                window.location.href = '/login';
            }).on('error', (error) => {
                console.error('Contract Error:', error);
                if (error.message.includes('gas')) {
                    alert('Lỗi gas: Vui lòng tăng gas limit hoặc kiểm tra số dư!');
                } else if (error.message.includes('rejected')) {
                    alert('Giao dịch đã bị từ chối bởi người dùng!');
                } else {
                    alert('Đăng ký thất bại: ' + error.message);
                }
            });
        } catch (error) {
            console.error('Registration Error:', error);
            alert('Có lỗi xảy ra trong quá trình đăng ký: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        var t = localStorage.getItem('token')
        var a = localStorage.getItem('account')
        t = t ? t : ""
        a = a ? a : ""
        if(t !== "" && a !== "") window.location.href = '/login';
        else {
            localStorage.removeItem('token')
            localStorage.removeItem('account')
            setToken('');
            setAccount('');
        }
    }, [token])

    return (
        <div className='register'>
            <div className='box'>
                <h2>Register</h2>
                <br />
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3" controlId="formWallet">
                        <Form.Label>Connect Wallet</Form.Label>
                        { account === "" ?
                        <Form.Control type="button" value="Connect to Metamask" onClick={connectWallet}/>
                        : <Form.Control type="button" disabled value={`Connected Wallet with Address: ${account}`}/>
                        }
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="formDesignation">
                        <Form.Label>Designation</Form.Label>
                        <Form.Select onChange={(e) => setDesignation(e.target.value)} value={designation}>
                            <option value="1">Patient</option>
                            <option value="2">Doctor</option>
                            <option value="3">Insurance Provider</option>
                        </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="formName">
                        <Form.Label>Name</Form.Label>
                        <Form.Control required type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="formEmail">
                        <Form.Label>Email</Form.Label>
                        <Form.Control required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" />
                    </Form.Group>
                    {designation === "1" && (
                        <Form.Group className="mb-3" controlId="formAge">
                            <Form.Label>Age</Form.Label>
                            <Form.Control 
                                required 
                                type="number" 
                                min="1"
                                value={age} 
                                onChange={(e) => setAge(e.target.value)} 
                                placeholder="Enter your age" 
                            />
                            <Form.Text className="text-muted">
                                Age is required for patients and must be greater than 0
                            </Form.Text>
                        </Form.Group>
                    )}
                    <Button 
                        variant="primary" 
                        type="submit" 
                        disabled={isLoading || account === ""}
                    >
                        {isLoading ? 'Đang xử lý...' : 'Register'}
                    </Button>
                </Form>
            </div>
        </div>
    )
}

export default Register