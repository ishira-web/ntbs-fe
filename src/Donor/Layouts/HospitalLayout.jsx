import React from 'react'
import Hospital from '../Pages/Hospital'
import Footer from '../Pages/footer'
import Navbar from '../components/navbar'

function HospitalLayout() {
  return (
    <div className='font-Outfit'>
      <Navbar/>
      <Hospital/>
      <Footer/>
    </div>
  )
}

export default HospitalLayout
