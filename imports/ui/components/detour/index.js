import React from 'react';
import { Button, Typography, Card } from 'antd';
import { useNavigate } from 'react-router-dom';
import { SmileOutlined, HomeOutlined, ContactsOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function Detour ({ isAuthorized }) {
    const navigate = useNavigate();

    const handleGoHome = () => navigate('/');
    const handleContact = () => navigate('/contact');

    return (
        <div style={{
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '88vh', 
            backgroundColor: '#f0f2f5',
            textAlign: 'center',
            padding: '0 20px'
        }}>
            <Card style={{ maxWidth: 500, padding: '30px 20px', borderRadius: 10, boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                <SmileOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                <Title level={2} style={{ marginTop: 16 }}>
                    {isAuthorized ? '¡Bienvenido a SIGMo!' : 'Acceso Denegado'}
                </Title>
                <Text style={{ fontSize: 16, color: '#595959' }}>
                    {isAuthorized ? 
                        'Nos alegra tenerte aquí. Explora las funcionalidades disponibles y contáctanos si tienes alguna duda.' :
                        'No tienes autorización para acceder a esta sección. Si necesitas ayuda, comunícate con el administrador.'}
                </Text>
                <div style={{ marginTop: 30 }}>
                    <Button 
                        type="primary" 
                        icon={<HomeOutlined />} 
                        onClick={handleGoHome} 
                        style={{ marginRight: 10 }}
                    >
                        Ir a Inicio
                    </Button>
                    <Button 
                        type="default" 
                        icon={<ContactsOutlined />} 
                        onClick={handleContact}
                    >
                        Contacto
                    </Button>
                </div>
            </Card>
        </div>
    );
};

